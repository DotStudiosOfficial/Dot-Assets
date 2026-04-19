const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');

async function generateProtoTree() {
    const rootProto = await protobuf.load("tree.proto");
    const FileTree = rootProto.lookupType("FileTree");

    function getTree(dir) {
        const stats = fs.statSync(dir);
        const name = path.basename(dir);
        const nodePath = dir === '.' ? '' : dir;

        if (stats.isDirectory()) {
            const children = fs.readdirSync(dir)
                .filter(child => !child.startsWith('.') && !['index.html', 'tree.js', 'tree.proto', 'files.bin', 'node_modules', 'package.json', 'bun.lock', '_headers'].includes(child))
                .map(child => getTree(path.join(dir, child)));
            
            return { name, path: nodePath, type: 1, children };
        } else {
            return { name, path: nodePath, type: 0 };
        }
    }

    const treeData = { root: getTree('.').children };
    
    const message = FileTree.create(treeData);
    const buffer = FileTree.encode(message).finish();
    
    fs.writeFileSync('files.bin', buffer);
    console.log("✅ Binary Protobuf tree generated: files.bin");
}

generateProtoTree();