from aqt import gui_hooks, mw
from aqt.editor import Editor
from aqt.webview import WebContent

from operator import itemgetter
from json import dumps as to_json
from re import compile as re_compile
from typing import Any, Dict, List, Tuple


TEMPLATES_KEY   = 'tmpls'
FRONT_SIDE_KEY  = 'qfmt'
BACK_SIDE_KEY   = 'afmt'

STYLE_ELEM_ID   = '__styler_note_css'



def style_note_fields(editor : Editor):
    note_css : str                          = editor.note.model()['css']
    note_fields : List[str]                 = editor.note.keys()
    note_templates : List[Dict[str, Any]]   = editor.note.model()[TEMPLATES_KEY]

    editor.web.eval(
f'''
        StylerAddon.loadNote({to_json(note_templates)}, `{note_css}`, {str(note_fields)});
'''
    )


def add_styler_scripts_on_page(web_content : WebContent, context: Any):
    if not isinstance(context, Editor):
        return

    addon_pkg = mw.addonManager.addonFromModule(__name__)

    web_content.js.append(f"/_addons/{addon_pkg}/web/styler.js")
    web_content.css.append(f"/_addons/{addon_pkg}/web/styler.css")

    web_content.head += f'<style id="{STYLE_ELEM_ID}" type="text/css"></style>'


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


mw.addonManager.setWebExports(__name__, r"web/.*(js|css)")

gui_hooks.editor_did_init_buttons.append(cb=add_styler_button)
gui_hooks.editor_did_init_shortcuts.append(cb=add_styler_shortcut)
gui_hooks.editor_did_load_note.append(cb=style_note_fields)

gui_hooks.webview_will_set_content.append(cb=add_styler_scripts_on_page)
