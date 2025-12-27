[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/bPpEXmle)

##
***RUN INSTRUCTIONS***
##

**Local**

Local (browser):
- navigate to ./team-5-mobile-apps in terminal
- run npm start in command line (or ionic serve)

**Without changes**

X-code/ android studio:
- navigate to ./team-5-mobile-apps in terminal
- Run the simulated device in xcode or android studio

Run on device:
- navigate to ./team-5-mobile-apps in terminal
- For android: find the apk file at: ./team-5-mobile-apps/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
- for iphone: Click on app in project navigator, select development team in signing and capabilities, connect phone to mac, click on build
- https://ionicframework.com/docs/angular/your-first-app/deploying-mobile

**With changes**

X-code/ android studio:
- navigate to ./team-5-mobile-apps in terminal
- run npm run build (or ionic capacitor build) in command line
- ionic cap copy (if web directory updated)
- npx cap sync ios (or android)
- npx cap open ios (or android)
- Run the simulated device in xcode or android studio

Run on device:
- navigate to ./team-5-mobile-apps in terminal
- ionic capacitor build ios (or android)
- ionic cap copy (if web directory updated)
- npx cap sync ios (or android)
- For android: find the apk file at: ./team-5-mobile-apps/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
- for iphone: Click on app in project navigator, select development team in signing and capabilities, connect phone to mac, click on build
- https://ionicframework.com/docs/angular/your-first-app/deploying-mobile

