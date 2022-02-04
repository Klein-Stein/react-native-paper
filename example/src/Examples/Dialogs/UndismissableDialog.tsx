import * as React from 'react';
import { Button, Portal, Dialog, Colors } from 'react-native-paper';
import { TextComponent } from './utils';

const UndismissableDialog = ({
  visible,
  close,
}: {
  visible: boolean;
  close: () => void;
}) => (
  <Portal>
    <Dialog onDismiss={close} visible={visible} dismissable={false}>
      <Dialog.Title>Alert</Dialog.Title>
      <Dialog.Content>
        <TextComponent>This is an undismissable dialog!!</TextComponent>
      </Dialog.Content>
      <Dialog.Actions>
        <Button color={Colors.teal500} disabled>
          Disagree
        </Button>
        <Button onPress={close}>Agree</Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
);

export default UndismissableDialog;
