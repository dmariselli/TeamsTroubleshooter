module.exports = {

    "extends": "eslint:recommended",
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "rules": {
        "array-bracket-spacing": "error",
        "array-callback-return": "error",
        "arrow-body-style": [
          "error",
          "as-needed"
        ],
        "arrow-parens": [
          "error",
          "as-needed"
        ],
        "arrow-spacing": "error",
        "indent": [
          "error",
          4,
          {
            "SwitchCase": 1
          }
        ],
        "block-spacing": "error",
        "brace-style": [
          "error",
          "1tbs"
        ],
        "camelcase": [
          "error",
          {
            "properties": "never"
          }
        ],
        "callback-return": [
          "error",
          [
            "cb",
            "callback",
            "next"
          ]
        ],
        "class-methods-use-this": "error",
        "comma-spacing": "error",
        "comma-style": [
          "error",
          "last"
        ],
        "consistent-return": "error",
        "curly": [
          "error",
          "multi"
        ],
        "default-case": "error",
        "dot-notation": [
          "error",
          {
            "allowKeywords": true
          }
        ],
        "eol-last": "error",
        "eqeqeq": "error",
        "func-call-spacing": "error",
        "func-style": [
          "error",
          "declaration"
        ],
        "generator-star-spacing": "error",
        "guard-for-in": "error",
        "key-spacing": [
          "error",
          {
            "beforeColon": false,
            "afterColon": true
          }
        ],
        "keyword-spacing": "error",
        "lines-around-comment": [
          "error",
          {
            "beforeBlockComment": true,
            "afterBlockComment": false,
            "beforeLineComment": true,
            "afterLineComment": false
          }
        ],
        "new-cap": "error",
        "newline-after-var": "error",
        "new-parens": "error",
        "no-alert": "error",
        "no-array-constructor": "error",
        "no-caller": "error",
        "no-confusing-arrow": "error",
        "no-console": "error",
        "no-delete-var": "error",
        "no-eval": "error",
        "no-extend-native": "error",
        "no-extra-bind": "error",
        "no-fallthrough": "error",
        "no-floating-decimal": "error",
        "no-global-assign": "error",
        "no-implied-eval": "error",
        "no-invalid-this": "error",
        "no-iterator": "error",
        "no-label-var": "error",
        "no-labels": "error",
        "no-lone-blocks": "error",
        "no-loop-func": "error",
        "no-mixed-spaces-and-tabs": [
          "error",
          false
        ],
        "no-multi-spaces": "error",
        "no-multi-str": "error",
        "no-native-reassign": "off",
        "no-nested-ternary": "error",
        "no-new": "error",
        "no-new-func": "error",
        "no-new-object": "error",
        "no-new-wrappers": "error",
        "no-octal": "error",
        "no-octal-escape": "error",
        "no-process-exit": "error",
        "no-proto": "error",
        "no-redeclare": "error",
        "no-return-assign": "error",
        "no-script-url": "error",
        "no-self-assign": "error",
        "no-sequences": "error",
        "no-shadow": "error",
        "no-shadow-restricted-names": "error",
        "no-tabs": "error",
        "no-trailing-spaces": "error",
        "no-undef": [
          "error",
          {
            "typeof": true
          }
        ],
        "no-undef-init": "error",
        "no-undefined": "error",
        "no-underscore-dangle": [
          "error",
          {
            "allowAfterThis": true
          }
        ],
        "no-unmodified-loop-condition": "error",
        "no-unused-expressions": "error",
        "no-unused-vars": [
          "error",
          {
            "vars": "all",
            "args": "after-used"
          }
        ],
        "no-use-before-define": "error",
        "no-useless-computed-key": "error",
        "no-useless-concat": "error",
        "no-useless-constructor": "error",
        "no-useless-escape": "error",
        "no-useless-return": "error",
        "no-with": "error",
        "no-var": "error",
        "object-curly-spacing": [
          "error",
          "always"
        ],
        "object-shorthand": "error",
        "one-var-declaration-per-line": "error",
        "prefer-arrow-callback": "error",
        "prefer-const": "error",
        "prefer-template": "error",
        "quotes": [1, "single"],
        "quote-props": [
          "error",
          "as-needed"
        ],
        "radix": "error",
        "require-jsdoc": "error",
        "semi": "error",
        "semi-spacing": [
          "error",
          {
            "before": false,
            "after": true
          }
        ],
        "space-before-blocks": "error",
        "space-before-function-paren": [
          "error",
          "never"
        ],
        "space-in-parens": "error",
        "space-infix-ops": "error",
        "space-unary-ops": [
          "error",
          {
            "words": true,
            "nonwords": false
          }
        ],
        "spaced-comment": [
          "error",
          "always",
          {
            "exceptions": [
              "-"
            ]
          }
        ],
        "strict": [
          "error",
          "global"
        ],
        "template-curly-spacing": [
          "error",
          "never"
        ],
        "valid-jsdoc": [
          "error",
          {
            "prefer": {
              "return": "returns"
            },
            "preferType": {
              "String": "string",
              "Number": "number",
              "Boolean": "boolean",
              "object": "Object",
              "function": "Function"
            }
          }
        ],
        "wrap-iife": "error",
        "yield-star-spacing": "error",
        "yoda": [
          "error",
          "never"
        ],
        "no-catch-shadow": "off",
        "no-mixed-requires": "error",
        "no-new-require": "error",
        "no-path-concat": "error",
        "handle-callback-err": [
          "error",
          "err"
        ]
    },
    "plugins": [
        'html'
    ]
}