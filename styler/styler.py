from aqt import gui_hooks
from aqt.editor import Editor

from typing import Dict, List, Tuple


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


CSS_PROP_SEP = ':'
CSS_PROP_END = ';'

def css_props_from_text(props_text : str) -> Dict[str, str]:
    props = dict()

    prop_begin = 0
    prop_sep = props_text.find(CSS_PROP_SEP, prop_begin)
    prop_end = props_text.find(CSS_PROP_END, prop_sep)

    while prop_sep >= 0:
        prop_name = props_text[prop_begin:prop_sep].strip()
        prop_value = props_text[prop_sep+1:prop_end].strip()

        props[prop_name] = prop_value

        prop_begin = prop_end + 1
        prop_sep = props_text.find(CSS_PROP_SEP, prop_begin)
        prop_end = props_text.find(CSS_PROP_END, prop_sep)

    return props


BODY_CLASS = '.card'

def style_note_fields(editor : Editor):
    note_css : str = editor.note.model()['css']
    note_fields : List[str] = editor.note.keys()

    i = note_css.find(BODY_CLASS)
    if i < 0:
        return

    body_style_begin = note_css.find('{', i + len(BODY_CLASS))
    body_style_end = note_css.find('}', body_style_begin+1)

    props = css_props_from_text(note_css[body_style_begin+1:body_style_end])

    editor.web.eval(
f'''
        let body_style = {str(props)};
        for (let i = 0; i < {len(note_fields)}; ++i) {{
            $(`#f${{i}}`).css(body_style)
        }}
'''
    )


gui_hooks.editor_did_init_buttons.append(cb=add_styler_button)
gui_hooks.editor_did_init_shortcuts.append(cb=add_styler_shortcut)
gui_hooks.editor_did_load_note.append(cb=style_note_fields)
