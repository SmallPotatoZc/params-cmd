# 使用

```sh
# 编译
yarn coffee -c  -o lib/ src/

# 检测编译
yarn coffee --watch --compile -o lib/ src/

# 打包成一个文件
yarn coffee --join lib/all.js --watch --compile src/*.coffee
```