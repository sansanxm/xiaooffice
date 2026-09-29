#!/bin/sh
# deb/rpm post-remove: drop the xiaooffice symlink only on a real uninstall.
case "$1" in
  0|remove|purge) ;;
  *) exit 0 ;;
esac
for link in "/usr/bin/xiaooffice" "/usr/bin/genoffice"; do
  if [ -L "$link" ]; then
    case "$(readlink "$link")" in
      /opt/Xiao*|/opt/xiao*|/opt/GenOffice/*) rm -f "$link" ;;
    esac
  fi
done
exit 0
