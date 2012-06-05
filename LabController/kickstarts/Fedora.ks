#if $varExists('sysprofile')
#set listed_snippet_profiles = $getVar('sysprofile','').split(';')
#for $snippet_profile in $listed_snippet_profiles
# Snippet Profile: $snippet_profile
$SNIPPET($snippet_profile)
#end for
#else
$SNIPPET("install_method")

#if $getVar('system_name', '') != '' and $getVar('manual', 'False') == 'False'
auth  --useshadow  --enablemd5
# System bootloader configuration
bootloader --location=mbr #slurp
#if $getVar('kernel_options_post','') != ''
    --append="$kernel_options_post"
#end if

# Use text mode install
$getVar('mode', 'text')
$SNIPPET("network")

#if $getVar('os_version','').startswith('fedora')
#set releasever=$os_version[6:]
repo --name=myupdates --mirrorlist=https://mirrors.fedoraproject.org/metalink?repo=updates-released-f$releasever&arch=$arch
#end if

## Firewall configuration
## firewall in kickstart metadata will enable the firewall
## firewall=22:tcp,80:tcp will enable the firewall with ports 22 and 80 open.
## always allow port 12432 so that beah harness will support multihost
firewall #slurp
#if $getVar('firewall', 'disabled') == 'disabled':
--disabled
#else
--enabled --port=12432:tcp #slurp
#if $getVar('firewall', '') != '':
,$getVar('firewall')
#end if
#end if

# Run the Setup Agent on first boot
firstboot --disable
# System keyboard
keyboard $getVar('keyboard', 'us')
# System language
lang $getVar('lang','en_US.UTF-8')
$yum_repo_stanza
reboot
#Root password
rootpw --iscrypted $getVar('password', $default_password_crypted)
# SELinux configuration
selinux $getVar('selinux','--enforcing')
#if $getVar('skipx','') != ''
# Do not configure the X Window System
skipx
#end if
# System timezone
timezone  $getVar('timezone', 'America/New_York')
# Install OS instead of upgrade
install

$SNIPPET("rhts_devices")
$SNIPPET("rhts_partitions")
$SNIPPET("Fedora")
$SNIPPET("system")

%packages --ignoremissing
#if $getVar('packages', '') != ''
$SNIPPET("rhts_packages")
#else
@development
@desktop-platform-devel
@server-platform-devel
#end if
%end

#end if
#end if
%pre --log=/dev/console
$SNIPPET("rhts_pre")
$SNIPPET("Fedora_pre")
$SNIPPET("system_pre")
%end


%post --log=/dev/console
$SNIPPET("rhts_post")
$SNIPPET("Fedora_post")
$SNIPPET("system_post")
%end

# Disable rhts-compat for Fedora15 and newer.
#if $getVar('os_version','').startswith('fedora')
#set releasever=$os_version[6:]
#if int($releasever) >= 15:
%post --log=/dev/console
cat >> /etc/profile.d/task-overrides-rhts.sh <<END
export RHTS_OPTION_COMPATIBLE=
export RHTS_OPTION_COMPAT_SERVICE=
END
%end
#end if
#end if

#if $getVar('ks_appends', '') != '':
$SNIPPET("ks_appends")
#end if
