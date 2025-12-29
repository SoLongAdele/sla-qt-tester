# 视觉测试资源

此目录存放视觉测试所需的模板图片资源。

## 目录结构

```
resources/
└── freecharts/           # FreeCharts 流程图编辑器的模板图片
    ├── logo.png          # 应用 Logo
    ├── newfile.png       # 新建文件按钮
    ├── pointer.png       # 选择工具
    ├── addline.png       # 添加线条工具
    ├── NodesIcon/        # 流程图节点图标
    │   ├── StartEnd.png  # 开始/结束节点
    │   ├── Step.png      # 步骤节点
    │   ├── Conditional.png # 条件/判断节点
    │   └── ...
    └── ...
```

## 使用方式

在 Pipeline 配置文件中，通过 `$resource_base` 指定资源目录：

```json
{
    "$resource_base": "../resources/freecharts",
    
    "点击新建": {
        "recognition": "TemplateMatch",
        "template": ["newfile.png"],
        "threshold": [0.6],
        "action": "Click"
    }
}
```

模板路径会自动基于 `$resource_base` 解析。

