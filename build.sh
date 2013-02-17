name="YAStatusbar"

mkdir ./locales/en
cp locale.js ./locales/en/

rm -f ./$name.oex
zip -r ./$name.zip ./config.xml ./includes/* ./js/* ./img/* ./css/* ./locales/* ./*.html ./*.css ./*.js
mv ./$name.zip ./$name.oex
