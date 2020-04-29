from aqt import gui_hooks
from aqt.editor import Editor

from operator import itemgetter
from re import compile as re_compile
from typing import Any, Dict, List, Tuple


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


BODY_CLASS = 'card'
TEMPLATES_KEY = 'tmpls'
FRONT_SIDE_KEY = 'qfmt'
BACK_SIDE_KEY = 'afmt'

CARD_ORD = 0  # TODO: Implement card switching

# TODO : Skip commented lines
RE_CSS_CLASS = re_compile("\.(?P<class>\w+)\s*\{\s*(?P<props>[^\}]*)\}")

def style_note_fields(editor : Editor):
    note_css : str = editor.note.model()['css']
    note_fields : List[str] = editor.note.keys()

    card_template : Dict[str, Any] = editor.note.model()[TEMPLATES_KEY][CARD_ORD]

    front_side, back_side = itemgetter(FRONT_SIDE_KEY, BACK_SIDE_KEY)(card_template)

    full_card = f"<div>{front_side}<br>{back_side}</div>"

    # TODO: Support type selectors and its combinations with class
    css_rules = {t[0] : css_props_from_text(t[1]) for t in RE_CSS_CLASS.findall(note_css)}

    # TODO: Support multiple class selection
    editor.web.eval(
f'''
        let card = $(`{full_card}`)
        let css = {str(css_rules)}
        let body_css_rule = css["{BODY_CLASS}"];
        let fields = {str(note_fields)};
        for (let i = 0; i < fields.length; ++i) {{
            let field = $(`#f${{i}}`);
            let field_name = fields[i];
            
            if (body_css_rule)
                field.css(body_css_rule);

            let elem = card.find(`div:contains("{{{{${{field_name}}}}}}")`);

            let elem_class = elem.attr("class");
            if (!elem_class)
                continue;

            let css_rule = css[elem_class]
            if (css_rule)
                field.css(css_rule);
        }}
'''
    )


gui_hooks.editor_did_init_buttons.append(cb=add_styler_button)
gui_hooks.editor_did_init_shortcuts.append(cb=add_styler_shortcut)
gui_hooks.editor_did_load_note.append(cb=style_note_fields)
