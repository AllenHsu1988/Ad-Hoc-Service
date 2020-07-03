A server providing iOS Ad-Hoc ipas via HTTPS

This project is based on [`ios-ipa-server`](https://github.com/bumaociyuan/ios-ipa-server)
# Support Platform
* OS X
* Ubuntu
* CentOS
* Not test for other platform

# Require
* [nodejs](https://nodejs.org/)

# Usage
`Make ipa folder like below:`
```
----<Path Of Ipas>
    ----<App Name>
        ----<YourApp>.ipa
        ----<YourApp>.ipa
    ----<App Name>
        ----<YourApp>.ipa
        ----<YourApp>.ipa
        ----<YourApp>.ipa
```
```
Usage: adHocService [option] [dir]

Options:

-h, --help                output usage information
-V, --version             output the version number
-p, --port <port-number>  set port for server (defaults is 1234)
-i, --ip <ip-address>     set ip address for server (defaults is automatic getting by program)
```

## Start Server
```

$ adHocService /path/of/ipa

# open https://ip:port/ on your iphone 

# get https://ip:port/refresh to refresh the list cache
```

### About `ipa` archive
* [Ad-hoc](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/TestingYouriOSApp/TestingYouriOSApp.html)
* [Enterprise Distributing](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/DistributingEnterpriseProgramApps/DistributingEnterpriseProgramApps.html)

### Install App
* Open `https://ip:port` page.
* The first time webpage will alert `Cannot Verify Server Identity`, click `Details` button, and install the certificate by follow the hint press next and input password.
* Click the `ipa` link to install `ipa`.
* iOS 10.3 [Issue](https://github.com/bumaociyuan/ios-ipa-server/issues/23) Settings > General > About (logically...) > Certificate Trust Settings > Enable Full Trust for Root Certificates

#Lisence
[MIT](https://github.com/AllenHsu1988/Ad-Hoc-Service/blob/master/LICENSE.md)
