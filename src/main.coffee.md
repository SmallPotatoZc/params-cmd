# 命令行参数解析

使用：parameters(config)

## 参数说明

为每一个参数配置参数

## 主体

代入 config 得到的结果。像参数一样，每个命令的 "main" 被定义在配置参数层级。
有下列参数被定义：

* name: 命令中的两个破折号参数的名字(如：--my_name)，除了已定义了 label 否则会出现解析之后返回的对象中。
* label: 还没有采用，请查看 name
* shortcut: 命令中一个破折号的的名字(如: -n)，一定是只有一个字母
* required: 布尔值，值为 true 在参数没有被定义时，意外会被抛出 
* type: 'string', 'integer' or 'array'

  Parameter = (config = {}) -> 
    @config = config
    # 处理 config
    sanitize_config = (config) ->
      config.options ?= {}
      # 将对象作为选项 name 的 key 值转化成数组
      config.options = array_to_object
    console.log "-----#{@config.test}"
  Parameter {test:111}