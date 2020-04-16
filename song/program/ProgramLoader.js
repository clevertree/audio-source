import React from "react";

class ProgramLoader {
    constructor(song) {
        this.song = song;
        // this.audioContext = audioContext;
        // this.destinations = new WeakMap();
    }

    loadInstanceFromDestination(programID, destination) {
        return this.loadInstanceFromID(programID);
        // let programs = this.destinations.get(destination);
        // if(!programs) {
        //     programs = {};
        //     this.destinations.set(destination, programs);
        // }
        // if(typeof programs[programID] === "undefined")
        //     programs[programID] = this.programLoadInstance(programID);

        // return programs[programID];
    }

    getData(programID) {
        if (!this.song.data.programs[programID])
            throw new Error("Invalid program ID: " + programID);
        return this.song.data.programs[programID];
    }


    getClassName(programID) {
        const [className] = this.getData(programID);
        return className;
    }
    getConfig(programID) {
        const [, config] = this.getData(programID);
        return config;
    }
    getClass(programID) {
        const className = this.getClassName(programID);
        const {classProgram} = ProgramLoader.getProgramClassInfo(className);
        return classProgram;
    }

    loadInstanceFromID(programID) {
        const [className, config] = this.getData(programID);
        return ProgramLoader.loadInstance(className, config);
    }


    programLoadRenderer(programID) {
        const [className, config] = this.getData(programID);
        const {classRenderer: Renderer} = ProgramLoader.getProgramClassInfo(className);
        return <Renderer
            programID={programID}
            config={config}
        />;
    }


    /** Actions **/

    unloadAllPrograms() {
        const classes = ProgramLoader.registeredProgramClasses;
        for(let i=0; i<classes.length; i++) {
            const {classProgram} = classes[i];
            if(!classProgram.unloadAll) {
                console.warn(classProgram.name + " has no static unloadAll method");
                continue;
            }
            classProgram.unloadAll();
        }

    }

    /** Menu **/



    /** Static **/

    static loadInstance(className, config={}) {
        const {classProgram} = this.getProgramClassInfo(className);
        return new classProgram(config);
    }

    static getProgramClassInfo(className) {
        const classes = ProgramLoader.registeredProgramClasses;
        for(let i=0; i<classes.length; i++) {
            const classInfo = classes[i];
            if(classInfo.className === className)
                return classInfo;
        }
        throw new Error(`Program class ${className} was not found`);
    }



    static addProgramClass(classProgram, classRenderer=null, title=null) {
        const className = classProgram.name;
        const classes = ProgramLoader.registeredProgramClasses;
        title = title || classProgram.name;
        classes.push({classProgram, classRenderer, className, title})
    }

    static getRegisteredPrograms() { return ProgramLoader.registeredProgramClasses; }
        // const classes = ProgramLoader.registeredProgramClasses;
        // const results = [];
        // for(let i=0; i<classes.length; i++) {
        //     const classInfo = classes[i];
        //     const {classObject, name, config} = classInfo;
        //     const result = callback(classObject, name, config);
        //     if(result !== null) results.push(result);
        //     if(result === false) break;
        // }
        // return results;
    // }
    static registeredProgramClasses = []
}

export default ProgramLoader;

