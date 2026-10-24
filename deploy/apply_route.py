#!/usr/bin/env python3
"""Install/remove the /tools location block in the edge proxy config.

Usage:
  apply_route.py install <conf> <block-file>
  apply_route.py remove  <conf>

The block is inserted inside the first server block whose server_name line
mentions moshtariat.ir, right before its catch-all `location / {`. The config
file is updated in place (same inode) because it may be a bind mount into the
running proxy container.
"""

import re
import sys

BEGIN = '    # >>> moshtariat-tools route'
END = '    # <<< moshtariat-tools route'


def fail(msg):
    sys.exit(f'apply_route: {msg}')


def read(path):
    return open(path, encoding='utf-8').read()


def install(conf_path, block_path):
    conf = read(conf_path)
    if 'moshtariat-tools route' in conf:
        fail('route already installed')
    # Must match the bare domain, not subdomains like app.moshtariat.ir.
    m = re.search(r'^\s*server_name\b[^\n;]*(?<![\w.])moshtariat\.ir', conf, re.M)
    if not m:
        fail('server block for moshtariat.ir not found')
    rest = conf[m.end():]
    loc = re.search(r'^\s*location / \{', rest, re.M)
    if not loc:
        fail('catch-all location / not found after moshtariat.ir server_name')
    block = f'{BEGIN}\n{read(block_path).rstrip()}\n{END}\n\n'
    at = m.end() + loc.start()
    open(conf_path, 'w', encoding='utf-8').write(conf[:at] + block + conf[at:])
    print('apply_route: route installed')


def remove(conf_path):
    conf = read(conf_path)
    new = re.sub(r'\n?[ \t]*# >>> moshtariat-tools route.*?# <<< moshtariat-tools route\n',
                 '\n', conf, flags=re.S)
    if new == conf:
        fail('route block not found')
    open(conf_path, 'w', encoding='utf-8').write(new)
    print('apply_route: route removed')


if __name__ == '__main__':
    if sys.argv[1] == 'install' and len(sys.argv) == 4:
        install(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == 'remove' and len(sys.argv) == 3:
        remove(sys.argv[2])
    else:
        fail(__doc__)
