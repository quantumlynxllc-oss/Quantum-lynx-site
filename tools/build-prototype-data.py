#!/usr/bin/env python3
"""Rebuild prototype/data.js from schema/. Run it after any schema change.

    python3 tools/build-prototype-data.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load(name):
    data = json.loads((ROOT / 'schema' / name).read_text(encoding='utf8'))
    data.pop('$comment', None)
    return data


data = load('services.json')
data['readiness'] = load('readiness.json')
data['legal'] = load('legal.json')

# These two are not used by the prototype, but a typo in them should still fail here.
load('lead.schema.json')
load('hubspot-properties.json')
load('site.json')

output = '/* Built from schema/ by tools/build-prototype-data.py. Edit those files, not this one. */\n'
output += 'window.QL_DATA = ' + json.dumps(data, indent=1, ensure_ascii=False) + ';\n'
(ROOT / 'prototype' / 'data.js').write_text(output, encoding='utf8')
print('prototype/data.js rebuilt')
