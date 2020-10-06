#!/usr/bin/env bash

cd s;

for i in *;
do
    name=`echo $i | cut -d'.' -f1`;
    echo Converting $name to Mp3;
    ffmpeg -i $name -acodec libmp3lame -ac 2 -ar 44100 -ab 128k -f mp3 "$name.mp3" -y >nul 2>&1;
    echo Deleting $name;
    rm $name;

    echo Renaming $name.mp3 $name;
    mv $name.mp3 $name;
done;

cd ..;