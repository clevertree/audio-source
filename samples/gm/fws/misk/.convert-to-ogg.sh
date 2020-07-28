#!/usr/bin/env bash

cd s;

for i in *;
do
    name=`echo $i | cut -d'.' -f1`;
    echo Converting $name to Ogg;
    ffmpeg -i $name -acodec libopus -b:a 128000 $name.opus -y >nul 2>&1;
    echo Deleting $name;
    rm $name;

    echo Renaming $name.opus $name;
    mv $name.opus $name;
done;

cd ..;