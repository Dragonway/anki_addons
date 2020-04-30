from aqt import gui_hooks
from aqt.editor import Editor

from operator import itemgetter
from re import compile as re_compile
from typing import Any, Dict, List, Tuple


BODY_CLASS = 'card'

TEMPLATES_KEY = 'tmpls'
FRONT_SIDE_KEY = 'qfmt'
BACK_SIDE_KEY = 'afmt'

STYLE_ELEM_ID = '__styler_note_css'

CARD_ORD = 0  # TODO: Implement card switching


def style_note_fields(editor : Editor):
    note_css : str = editor.note.model()['css']
    note_fields : List[str] = editor.note.keys()

    card_template : Dict[str, Any] = editor.note.model()[TEMPLATES_KEY][CARD_ORD]

    front_side, back_side = itemgetter(FRONT_SIDE_KEY, BACK_SIDE_KEY)(card_template)

    full_card = f"<div>{front_side}<br>{back_side}</div>"

    editor.web.eval(
f'''
    {{
        let card = $(`{full_card}`);

        var note_style_elem = $("#{STYLE_ELEM_ID}");
        if (note_style_elem.length)
            note_style_elem.text(`{note_css}`);
        else
            $("head").append(`<style id="{STYLE_ELEM_ID}" type="text/css">{note_css}</style>`);

        let fields = {str(note_fields)};
        for (let i = 0; i < fields.length; ++i) {{
            let field = $(`#f${{i}}`);
            let field_name = fields[i];
            
            field.addClass("{BODY_CLASS}");

            let elem = card.find(`div:contains("{{{{${{field_name}}}}}}")`);
            let elem_class = elem.attr("class");
            
            field.addClass(elem_class);
        }}
    }}
'''
    )


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
gui_hooks.editor_did_load_note.append(cb=style_note_fields)
