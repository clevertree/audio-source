import { Alert } from "react-native";

export default class PromptManager {

    /** Prompt **/

    static async openPromptDialog(message, defaultValue='') {
        return await new Promise(resolve => {
            Alert.alert(
                "Prompt (Work In Progress)",
                message,
                [
                    {
                        text: "Cancel",
                        onPress: () => resolve(false),
                        style: "cancel"
                    },
                    { text: "OK", onPress: () => resolve(true) }
                ],
                { cancelable: false }
            );
        });

    }

    static async openConfirmDialog(message) {
        return await new Promise(resolve => {
            Alert.alert(
                "Confirm",
                message,
                [
                    {
                        text: "Cancel",
                        onPress: () => resolve(false),
                        style: "cancel"
                    },
                    { text: "OK", onPress: () => resolve(true) }
                ],
                { cancelable: false }
            );
        });
    }
}
