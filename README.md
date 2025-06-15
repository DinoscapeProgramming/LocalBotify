# LocalBotify

- copy node versions into tools/node/{os}/{arch}/node{".exe" || ""} folder
- copy fontawesome v6.4.0 release into packages/fontawesome folder
- copy twemoji assets into packages/picmo/assets folder
- remove loggers in node_modules/yahoo-finance2/dist/cjs/src/lib/options.js

- run `Remove-Item ./build`
- select a
- run npm run buildAll (cross-compile for win32-x64 & win32-arm64)
- run ./build/*.exe

- compiled version ready to go