# Roadmap

- [ ] MeiliSearch 单条消息添加索引效率似乎十分不佳。需要有个打包机制，满 100 条或者 60 秒打包提交一次之类的。
- [ ] 如果有打包提交机制，那就需要有 graceful 退出，或者缓存