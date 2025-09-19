# Raspberry Pi Kiosk Runbook

This runbook describes how to deploy **rpidash** on a Raspberry Pi 4/5 with the 7" (1024×600) official touchscreen. The goal is a headless kiosk that boots directly into Chromium, keeps the display awake, and reconnects to Home Assistant automatically.

## 1. Base Image

1. Download **Raspberry Pi OS Lite (64-bit)**.
2. Flash the image with the Raspberry Pi Imager and enable SSH + Wi-Fi if desired.
3. Boot the Pi and update packages:

   ```bash
   sudo apt update && sudo apt full-upgrade -y
   sudo reboot
   ```

## 2. Install Desktop & Browser

```bash
sudo apt install -y --no-install-recommends xserver-xorg x11-xserver-utils xinit openbox
sudo apt install -y chromium-browser unclutter git curl
```

Disable screen blanking at the OS level:

```bash
sudo tee -a /etc/xdg/openbox/autostart >/dev/null <<'EOF'
xset s off
xset -dpms
xset s noblank
EOF
```

## 3. Deploy rpidash

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/<your-org>/rpidash.git
cd rpidash
npm install
npm run build
```

Serve the built files:

```bash
npm install -g serve
serve -s dist -l 4173
```

To run as a service (systemd unit `/etc/systemd/system/rpidash.service`):

```ini
[Unit]
Description=rpidash kiosk web server
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/apps/rpidash
ExecStart=/usr/bin/env npx serve -s dist -l 4173
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable --now rpidash
```

## 4. Autostart Chromium in Kiosk Mode

Create `~/.config/openbox/autostart` (replace existing content):

```bash
#!/bin/sh
unclutter -idle 1 -root &
while true; do
  chromium-browser \
    --app=http://localhost:4173 \
    --kiosk \
    --noerrdialogs \
    --disable-session-crashed-bubble \
    --incognito \
    --enable-features=OverlayScrollbar \
    --start-fullscreen
done
```

Make it executable: `chmod +x ~/.config/openbox/autostart`.

Configure `.xinitrc` to launch Openbox:

```bash
echo "exec openbox-session" > ~/.xinitrc
```

Create a systemd service to start X on boot (`/etc/systemd/system/kiosk.service`):

```ini
[Unit]
Description=Launch X session for kiosk
After=systemd-user-sessions.service rpidash.service

[Service]
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStart=/usr/bin/startx
Restart=always

[Install]
WantedBy=graphical.target
```

Enable it:

```bash
sudo systemctl enable --now kiosk
```

## 5. Environment Configuration

1. Browse to `http://localhost:4173` from the Pi.
2. Open **Settings → Home Assistant** and paste your base URL and long-lived token.
3. Use the **Display & Density** section to set theme preferences.
4. Enable **Hold display awake** to request the Wake Lock API.

## 6. Maintenance Tips

- Update the app via `git pull` + `npm run build` and restart the `rpidash` service.
- Regenerate the token in Home Assistant every 90 days and update the settings page.
- Monitor logs: `journalctl -u rpidash -u kiosk -f`.
- To exit kiosk mode, press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Backspace</kbd> to terminate X, or SSH and stop the `kiosk` service.

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Chromium shows “Aw, Snap!” | Ensure adequate swap: `sudo dphys-swapfile setup` (512 MB). |
| Screen goes to sleep | Confirm Wake Lock is active and DPMS commands exist in Openbox autostart. |
| No network on boot | Configure Wi-Fi via `raspi-config` or Ethernet; kiosk will retry connecting to HA automatically. |

---

This setup keeps the Pi in kiosk mode with automatic reconnects, offline resilience (PWA cache), and centralized configuration through the rpidash Settings page.
