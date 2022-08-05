import * as Blockly from 'blockly/core';
import 'blockly/javascript';

/*Blockly.JavaScript['test_react_field'] = function () {
    return 'console.log(\'custom block\');\n';
};

Blockly.JavaScript['test_react_date_field'] = function (block) {
    return 'console.log(' + block.getField('DATE').getText() + ');\n';
};*/

Blockly.JavaScript['go_left'] = function () {
    return 'go_left();\n';
};

Blockly.JavaScript['go_right'] = function () {
    return 'go_right();\n';
};

Blockly.JavaScript['go_up'] = function () {
    return 'go_up();\n';
};

Blockly.JavaScript['go_down'] = function () {
    return 'go_down();\n';
};

Blockly.JavaScript['get_left'] = function () {
    var code = '\'left\'';
    return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['get_right'] = function () {
    var code = '\'right\'';
    return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['get_up'] = function () {
    var code = '\'up\'';
    return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['get_down'] = function () {
    var code = '\'down\'';
    return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['put_obstacle'] = function (block) {
    var value_name = Blockly.JavaScript.valueToCode(block, 'direction', Blockly.JavaScript.ORDER_ATOMIC);
    let code = 'put_obstacle('+ value_name +');\n';
    return code;
};

