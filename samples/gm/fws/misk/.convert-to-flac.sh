#!/usr/bin/env bash

cd s;

for i in *;
do
    name=`echo $i | cut -d'.' -f1`;
    echo Converting $name to flac;
    ffmpeg -i $name -af aformat=s16:44100 $name.flac -y >nul 2>&1;
    echo Deleting $name;
    rm $name;

    echo Renaming $name.flac $name;
    mv $name.flac $name;
done;

cd ..;