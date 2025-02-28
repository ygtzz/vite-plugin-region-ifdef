import { createFilter, createLogger } from 'vite';
import { loadEnv } from 'vite';
const logger = createLogger(undefined, { prefix: 'vite-plugin-region-ifdef' });

export default function regionIfdefPlugin(options = {}) {
    let params = {};
    
    return {
        name: 'vite-plugin-region-ifdef',
        //dev 和 build 都会执行

        enforce: 'pre',
        enbale: true,
        //配置为开发模式 可以进行 debug


        configResolved(config) {
            // 解析命令行参数
            const args = process.argv.slice(2);
            params = {
                //合并loadEnv
                include: ['**/*'],
                exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
                ...loadEnv(config.mode ?? process.env.NODE_ENV, process.cwd(), ''),
                ...options,
                ...options.env || {},
            };
        },
        transformIndexHtml(html, ctx) {
            let res = commonTransform(html, ctx.filename);

            return (res || {}).code || html;
        },
        transform(code, path) {
            console.log('path: ', path);
            
            let res = commonTransform(code, path);
            return res;
        }
    }
    
    function commonTransform(code, path){
        const filter = createFilter(params.include, params.exclude);
        if (!filter(path)) {
            return null;
        }
        //第一代正则
        // const jsReg = /\/\/\s*#(ifdef|ifndef)\s+(.+)\s*([\s\S]*?)\/\/\s*#endif/g;
        // const htmlReg = /<!--\s*#(ifdef|ifndef)\s+(.+)\s*-->([\s\S]*?)<!--\s*#endif\s*-->/g;
        // const cssReg = /\/\*\s*#(ifdef|ifndef)\s+(.+)\s*\*\/([\s\S]*?)\/\*\s*#endif\s*\*\//g;
        //第二代正则
        // const jsReg = /^[ \t]*\/\/\s*#(ifdef|ifndef)\s+(.+)\s*\n([\s\S]*?)^[ \t]*\/\/\s*#endif/gm;
        // const htmlReg = /^[ \t]*<!--\s*#(ifdef|ifndef)\s+(.+)\s*-->([\s\S]*?)^[ \t]*<!--\s*#endif\s*-->/gm;
        // const cssReg = /^[ \t]*\/\*\s*#(ifdef|ifndef)\s+(.+)\s*\*\/([\s\S]*?)^[ \t]*\/\*\s*#endif\s*\*\//gm;
        //第三代正则
        // const jsReg = /^[ \t]*\/\/\s*#(ifdef|ifndef)\s+(.+)\s*\n([\s\S]*?)^[ \t]*\/\/\s*#endif[ \t]*$/gm;
        // const htmlReg = /^[ \t]*<!--\s*#(ifdef|ifndef)\s+(.+)\s*-->([\s\S]*?)^[ \t]*<!--\s*#endif\s*-->[ \t]*$/gm;
        // const cssReg = /^[ \t]*\/\*\s*#(ifdef|ifndef)\s+(.+)\s*\*\/([\s\S]*?)^[ \t]*\/\*\s*#endif\s*\*\/[ \t]*$/gm;
    
        //第四代正则
        const jsReg = /^[ \t]*\/\/\s*#(ifdef|ifndef|region\s+ifdef|region\s+ifndef)\s+(.+)\s*\n([\s\S]*?)^[ \t]*\/\/\s*#(endif|endregion +endif)*$/gm;
        const htmlReg = /^[ \t]*<!--\s*#(ifdef|ifndef|region\s+ifdef|region\s+ifndef)\s+(.+)\s*-->([\s\S]*?)^[ \t]*<!--\s*#(endif|endregion +endif)\s*-->/gm;
        const cssReg = /^[ \t]*\/\*\s*#(ifdef|ifndef|region\s+ifdef|region\s+ifndef)\s+(.+)\s*\*\/([\s\S]*?)^[ \t]*\/\*\s*#(endif|endregion +endif)\s*\*\//gm;
        //第五代正则
        const jsRegStart = /^[ \t]*\/\/\s*#(ifdef|ifndef|region\s+ifdef|region\s+ifndef)\s+(.+)\s*\n/gm;
        const htmlRegStart = /^[ \t]*<!--\s*#(ifdef|ifndef|region\s+ifdef|region\s+ifndef)\s+(.+)\s*-->/gm;
        const cssRegStart = /^[ \t]*\/\*\s*#(ifdef|ifndef|region\s+ifdef|region\s+ifndef)\s+(.+)\s*\*\//gm;
    
        const jsRegEnd = /^[ \t]*\/\/\s*#(endif|endregion +endif)*$/gm;
        const htmlRegEnd = /^[ \t]*<!--\s*#(endif|endregion +endif)\s*-->/gm;
        const cssRegEnd = /^[ \t]*\/\*\s*#(endif|endregion +endif)\s*\*\//gm;
    
        const evaluate = (condition, variable, defs) => {
            const script = `return (${variable}) ? true : false;`;
            let result;
            const args = Object.keys(defs).filter((k) => {
                //过滤掉不能作为变量的数据串
                return !isNaN(k) || k.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
            });
            let scriptFunction;
            try {
                scriptFunction = new Function(...args, script);
            } catch (error) {
                logger.error(error);
                //  logger.error(new Error(`Error in file ${path} at line ${error.lineNumber} column ${error.columnNumber} variable ${variable}`));
                return false;
            }
            try {
                result = scriptFunction(...args.map((k) => defs[k]));
            } catch (error) {
                result = false;
            }
            if (condition.startsWith('ifndef') || condition.startsWith('region ifndef')) {
                result = !result;
            }
            //  logger.error(result,condition,variable);
            return result;
        }
        //条件编译解析
        const findRegion = (regStart, regEnd) => {
            let startTags = [];
            let endTags = [];
            let match;
            while (match = regStart.exec(code)) {
                startTags.push(match);
            }
            while (match = regEnd.exec(code)) {
                endTags.push(match);
            }
            if (startTags.length !== endTags.length) {
                logger.error(new Error(`Error in file ${path} at line ${startTags.length} column ${endTags.length} `));
                return null;
            }
            // 结束标签索引
            let endTagIndex = 0;
            // 结束标签
            let endTag = endTags[endTagIndex];
            //任务列表
            let tacks = [];
            //层级
            let level = 0;
            for (let i = 0; i < startTags.length; i++) {
                let start = startTags[i];
                let nextStart = startTags[i + 1];
                let [tag, condition, variable] = start;
                //运算条件
                condition = evaluate(condition, variable, params);
                if (start.index < endTag.index && (!nextStart || nextStart.index > endTag.index)) {
                    tacks.unshift({
                        tag,
                        start: start.index,
                        end: endTag.index,
                        condition,
                        level: level,
                        variable,
                        replaceContent: code.substring(start.index, endTag.index + endTag[0].length),
                        content: code.substring(start.index + start[0].length, endTag.index),
                    })
                    endTagIndex++;
                    endTag = endTags[endTagIndex];
                    //寻找父节点 结束标签
                    for (let j = 1; j < tacks.length; j++) {
                        let tack = tacks[j];
                        // 设置结束标签
                        if (tack.end == null) {
                            if (!nextStart || endTag.index < nextStart.index) {
                                level--;
                                tack.end = endTag.index;
                                tack.replaceContent = code.substring(tack.start, endTag.index + endTag[0].length);
                                tack.content = code.substring(tack.start + tack.tag.length, endTag.index);
                                endTagIndex++;
                                endTag = endTags[endTagIndex];
                                // console.log('父节点',endTag.index,tack);
                            }
                        }
                    }
                } else if (start.index < endTag.index) {
                    //父节点
                    tacks.unshift({
                        tag,
                        start: start.index,
                        end: null,
                        condition,
                        level: level,
                        variable,
                        replaceContent: '',
                        content: '',
                    })
                    level++;
                } else {
                    // console.log('没有匹配到', start.index, endTag.index);
                }
            }
            //按照level排序
            tacks.sort((a, b) => a.level - b.level);
            // console.log(tacks, '===tacks===');
            //任务替换
            for (let i = 0; i < tacks.length; i++) {
                let tack = tacks[i];
                code = code.replace(tack.replaceContent, tack.condition ? tack.content : '');
            }
        }
        // 替换
        findRegion(htmlRegStart, htmlRegEnd);
        findRegion(jsRegStart, jsRegEnd);
        findRegion(cssRegStart, cssRegEnd);
        
        return {
            code,
            map: null
        }
    }
}