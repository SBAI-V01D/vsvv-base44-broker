import sys
try:
    from opencode import skills as skillSKILL --- error message here
except ImportError as e:
    print(str(e), file=sys.stderr)
    exit(2)

import yaml, glob
sk = skillSKILL(**skill("--help 2>&1")[:0])