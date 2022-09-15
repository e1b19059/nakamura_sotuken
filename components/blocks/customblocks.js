/**
 * @license
 * 
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Define custom blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

// More on defining blocks:
// https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks


import * as Blockly from 'blockly/core';

// Since we're using json to initialize the field, we'll need to import it.
import '../fields/BlocklyReactField';

const goLeftField = {
  "type": "go_left",
  "message0": "左に進む",
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
};

const goRightField = {
  "type": "go_right",
  "message0": "右に進む",
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
};

const goUpField = {
  "type": "go_up",
  "message0": "上に進む",
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
};

const goDownField = {
  "type": "go_down",
  "message0": "下に進む",
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
};

Blockly.Blocks['go_left'] = {
  init: function () {
    this.jsonInit(goLeftField);
  }
};

Blockly.Blocks['go_right'] = {
  init: function () {
    this.jsonInit(goRightField);
  }
};

Blockly.Blocks['go_up'] = {
  init: function () {
    this.jsonInit(goUpField);
  }
};

Blockly.Blocks['go_down'] = {
  init: function () {
    this.jsonInit(goDownField);
  }
};

const put_obstacle = {
  "type": "put_obstacle",
  "message0": "%1 に障害物を設置する",
  "args0": [
    {
      "type": "input_value",
      "name": "direction",
      "check": "direction",
    }
  ],
  "inputsInline": true,
  "previousStatement": null,
  "nextStatement": null,
  "colour": 270,
  "tooltip": "",
  "helpUrl": ""
};

Blockly.Blocks['put_obstacle'] = {
  init: function () {
    this.jsonInit(put_obstacle);
  }
};

const get_left = {
  "type": "get_left",
  "message0": "左",
  "inputsInline": true,
  "output": "direction",
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
}

const get_right = {
  "type": "get_right",
  "message0": "右",
  "inputsInline": true,
  "output": "direction",
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
}

const get_up = {
  "type": "get_up",
  "message0": "上",
  "inputsInline": true,
  "output": "direction",
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
}

const get_down = {
  "type": "get_down",
  "message0": "下",
  "inputsInline": true,
  "output": "direction",
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
}

Blockly.Blocks['get_left'] = {
  init: function () {
    this.jsonInit(get_left);
  }
};

Blockly.Blocks['get_right'] = {
  init: function () {
    this.jsonInit(get_right);
  }
};

Blockly.Blocks['get_up'] = {
  init: function () {
    this.jsonInit(get_up);
  }
};

Blockly.Blocks['get_down'] = {
  init: function () {
    this.jsonInit(get_down);
  }
};

const check_object = {
  "type": "check_object",
  "message0": "%1 方向に %2 がある",
  "args0": [
    {
      "type": "input_value",
      "name": "direction",
      "check": "direction",
    },
    {
      "type": "input_value",
      "name": "object",
      "check": "object",
    }
  ],
  "inputsInline": true,
  "output": "Boolean",
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
}

Blockly.Blocks['check_object'] = {
  init: function () {
    this.jsonInit(check_object);
  }
};

const obstacle = {
  "type": "obstacle",
  "message0": "障害物",
  "inputsInline": true,
  "output": "object",
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
}

Blockly.Blocks['obstacle'] = {
  init: function () {
    this.jsonInit(obstacle);
  }
};

const player = {
  "type": "player",
  "message0": "相手プレイヤー",
  "inputsInline": true,
  "output": "object",
  "colour": 230,
  "tooltip": "",
  "helpUrl": ""
}

Blockly.Blocks['player'] = {
  init: function () {
    this.jsonInit(player);
  }
};