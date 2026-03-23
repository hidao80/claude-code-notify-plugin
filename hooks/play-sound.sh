#!/usr/bin/env bash
set -u

play_macos() {
  local sound_file="/System/Library/Sounds/Glass.aiff"
  if command -v afplay >/dev/null 2>&1 && [ -f "$sound_file" ]; then
    afplay "$sound_file" >/dev/null 2>&1
    return 0
  fi

  if command -v osascript >/dev/null 2>&1; then
    osascript -e 'beep 1' >/dev/null 2>&1
    return 0
  fi

  printf '\a'
  return 0
}

play_linux() {
  local sound_file
  for sound_file in \
    "/usr/share/sounds/freedesktop/stereo/complete.oga" \
    "/usr/share/sounds/freedesktop/stereo/message.oga" \
    "/usr/share/sounds/alsa/Front_Center.wav"
  do
    if [ -f "$sound_file" ]; then
      if command -v paplay >/dev/null 2>&1; then
        paplay "$sound_file" >/dev/null 2>&1 && return 0
      fi
      if command -v pw-play >/dev/null 2>&1; then
        pw-play "$sound_file" >/dev/null 2>&1 && return 0
      fi
      if command -v aplay >/dev/null 2>&1; then
        aplay -q "$sound_file" >/dev/null 2>&1 && return 0
      fi
    fi
  done

  if command -v canberra-gtk-play >/dev/null 2>&1; then
    canberra-gtk-play -i complete >/dev/null 2>&1 && return 0
  fi

  if command -v speaker-test >/dev/null 2>&1; then
    speaker-test -q -t sine -f 880 -l 1 >/dev/null 2>&1 && return 0
  fi

  printf '\a'
  return 0
}

case "$(uname -s)" in
  Darwin)
    play_macos
    ;;
  Linux)
    play_linux
    ;;
  *)
    printf '\a'
    ;;
esac
