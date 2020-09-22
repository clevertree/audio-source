import ASUIInputText from "./ASUIInputText";

export default class ASUIInputPassword extends ASUIInputText {

    getInputProps() {
        const props = super.getInputProps();
        props.type = 'password';
        return props;
    }

}
