from aqt import gui_hooks
from aqt.editor import Editor

from typing import List, Tuple


def on_style(editor : Editor):
    pass


def add_styler_button(buttons : List[str], editor : Editor):
    editor._links['style'] = on_style
    buttons.append(
        editor._addButton(
            icon='', # TODO: Create some icon
            cmd='style',
            tip='Set style (Ctrl+S)'
        ),
    )


def add_styler_shortcut(shortcuts : List[Tuple], _ : Editor):
    shortcuts.append(
        ("Ctrl+S", on_style)
    )


gui_hooks.editor_did_init_buttons.append(cb=add_styler_button)
gui_hooks.editor_did_init_shortcuts.append(cb=add_styler_shortcut)
