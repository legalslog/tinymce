import { Bounds, Boxes } from '@ephox/alloy';
import { Cell, Fun } from '@ephox/katamari';

import Editor from 'tinymce/core/api/Editor';
import ThemeManager, { RenderResult, Theme } from 'tinymce/core/api/ThemeManager';

import NotificationManagerImpl from './alien/NotificationManagerImpl';
import * as Options from './api/Options';
import { Autocompleter } from './Autocompleter';
import * as ScrollingContext from './modes/ScrollingContext';
import * as Render from './Render';
import * as ColorOptions from './ui/core/color/Options';
import * as WindowManager from './ui/dialog/WindowManager';
import * as ContextMenuOptions from './ui/menus/contextmenu/Options';

type RenderInfo = Render.RenderInfo;

const registerOptions = (editor: Editor) => {
  Options.register(editor);
  ColorOptions.register(editor);
  ContextMenuOptions.register(editor);
};

export default (): void => {
  ThemeManager.add('silver', (editor): Theme => {
    registerOptions(editor);

    const popupSinkBounds = Cell<() => Bounds>(() => Boxes.win());

    const { dialogs, popups, renderUI: renderModeUI }: RenderInfo = Render.setup(editor, {
      getPopupSinkBounds: popupSinkBounds.get()
    });

    const renderUI = (): RenderResult => {
      const renderResult = renderModeUI();
      const optScrollingContext = ScrollingContext.detect(popups.getMothership().element);

      optScrollingContext.each(
        (sc) => popupSinkBounds.set(
          () => ScrollingContext.getBoundsFrom(sc)
        )
      );
      return renderResult;
    };

    Autocompleter.register(editor, popups.backstage.shared);

    const windowMgr = WindowManager.setup({
      editor,
      backstages: {
        popup: popups.backstage,
        dialog: dialogs.backstage
      }
    });

    // The NotificationManager uses the popup mothership (and sink)
    const getNotificationManagerImpl = () => NotificationManagerImpl(
      editor,
      { backstage: popups.backstage },
      popups.getMothership()
    );

    return {
      renderUI,
      getWindowManagerImpl: Fun.constant(windowMgr),
      getNotificationManagerImpl
    };
  });
};
