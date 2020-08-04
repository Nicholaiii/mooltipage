import test from 'ava';
import { MockPipeline } from '../_mocks/mockPipeline';
import { Node, DocumentNode, TagNode, MVarNode, MScopeNode, ScopeKey, Fragment, MDataNode, MimeType } from '../../lib';
import { HtmlCompilerContext } from '../../lib/pipeline/module/htmlCompiler';
import { VarModule } from '../../lib/pipeline/module/compiler/varModule';
import * as NodeLogic from '../../lib/dom/nodeLogic';
import { PipelineContext } from '../../lib/pipeline/standardPipeline';
import { createFragmentScope } from '../../lib/pipeline/module/evalEngine';

function runVarModule(node: Node, cleanup = true, fragmentParams: ReadonlyMap<ScopeKey, unknown> = new Map(), pipeline = new MockPipeline()) {
    const testFrag: Fragment = {
        path: 'page.html',
        dom: new DocumentNode()
    };
    const testContext: PipelineContext = {
        pipeline: pipeline,
        fragment: testFrag,
        fragmentContext: {
            parameters: fragmentParams,
            slotContents: new Map(),
            scope: createFragmentScope(fragmentParams)
        }
    };

    const htmlContext = new HtmlCompilerContext(testContext, node);
    const varsModule = new VarModule();

    varsModule.enterNode(htmlContext);

    if (cleanup && !htmlContext.isDeleted) {
        varsModule.exitNode(htmlContext);
    }
}

test('[unit] VarModule does not affect standard elements', t => {
    const parent = new TagNode('div');
    const child = new TagNode('div');
    NodeLogic.appendChild(parent, child);

    runVarModule(child);

    t.is(child.parentNode, parent);
});

test('[unit] VarModule loads root scope into document', t => {
    const params = new Map<ScopeKey, unknown>();
    params.set('test', 123);

    const dom = new DocumentNode();

    runVarModule(dom, true, params);

    t.is(dom.nodeData.test, 123);
});

test('[unit] VarModule loads m-var into the parent scope', t => {
    const parent = new TagNode('div');
    const childVar = new MVarNode(new Map([['test', 123]]));
    const childDiv = new TagNode('div');
    NodeLogic.appendChild(parent, childVar);
    NodeLogic.appendChild(parent, childDiv);

    runVarModule(childVar);

    t.is(parent.nodeData.test, 123);
    t.is(childDiv.nodeData.test, 123);
});

test('[unit] VarModule removes m-var after processing', t => {
    const parent = new TagNode('div');
    const childVar = new MVarNode(new Map([['test', 123]]));
    const childDiv = new TagNode('div');
    NodeLogic.appendChild(parent, childVar);
    NodeLogic.appendChild(parent, childDiv);

    runVarModule(childVar);

    t.falsy(childVar.parentNode);
    t.false(parent.childNodes.includes(childVar));
});

test('[unit] VarModule loads m-scope into its own scope', t => {
    const parent = new TagNode('div');
    const childScope = new MScopeNode(new Map([['test', 123]]));
    const childDivOuter = new TagNode('div');
    const childDivInner = new TagNode('div');
    NodeLogic.appendChild(parent, childScope);
    NodeLogic.appendChild(parent, childDivOuter);
    NodeLogic.appendChild(childScope, childDivInner);

    runVarModule(childScope, false);

    t.falsy(parent.nodeData.test);
    t.falsy(childDivOuter.nodeData.test);
    t.is(childDivInner.nodeData.test, 123);
});

test('[unit] VarModule removes m-scope after processing', t => {
    const parent = new TagNode('div');
    const childScope = new MScopeNode(new Map([['test', 123]]));
    const childDivOuter = new TagNode('div');
    const childDivInner = new TagNode('div');
    NodeLogic.appendChild(parent, childScope);
    NodeLogic.appendChild(parent, childDivOuter);
    NodeLogic.appendChild(childScope, childDivInner);

    runVarModule(childScope);

    t.falsy(childScope.parentNode);
    t.false(parent.childNodes.includes(childScope));
    t.is(childDivInner.parentNode, parent);
    t.is(childDivOuter.parentNode, parent);

    // scope vars are lost after it is deleted
    t.falsy(parent.nodeData.test);
    t.falsy(childDivInner.nodeData.test);
    t.falsy(childDivOuter.nodeData.test);
});

test('[unit] VarModule handles m-var with null attributes', t => {
    const parent = new DocumentNode();
    const mVar = new MVarNode();
    mVar.setRawAttribute('test', null);
    parent.appendChild(mVar);

    runVarModule(mVar);

    t.true(mVar.hasAttribute('test'));
    t.is(mVar.getRawAttribute('test'), null);
});

test('[unit] VarModule handles m-scope with null attributes', t => {
    const mScope = new MScopeNode();
    mScope.setRawAttribute('test', null);

    runVarModule(mScope);

    t.true(mScope.hasAttribute('test'));
    t.is(mScope.getRawAttribute('test'), null);
});

test('[unit] VarModule removes <m-data>', t => {
    const mData = new MDataNode(MimeType.TEXT);

    const root = new DocumentNode();
    root.appendChild(mData);
    
    runVarModule(mData);

    t.falsy(mData.parentNode);
});

test('[unit] VarModule compiles text', t => {
    const dataSrc = 'text.txt';
    const dataType = MimeType.TEXT;
    const dataValue = 'Test text';
    const dataVar = 'test';

    const mData = new MDataNode(dataType);
    mData.setAttribute(dataVar, dataSrc);

    const root = new DocumentNode();
    root.appendChild(mData);

    const pipe = new MockPipeline();
    pipe.mockRawTexts.push([dataSrc, dataType, dataValue]);
    
    runVarModule(mData, undefined, undefined, pipe);

    t.is(root.nodeData[dataVar], dataValue);
});

test('[unit] VarModule compiles json', t => {
    const dataSrc = 'json.json';
    const dataType = MimeType.JSON;
    const dataValue = '{ "testvalue": "value" }';
    const dataVar = 'test';

    const mData = new MDataNode(dataType);
    mData.setAttribute(dataVar, dataSrc);

    const root = new DocumentNode();
    root.appendChild(mData);

    const pipe = new MockPipeline();
    pipe.mockRawTexts.push([dataSrc, dataType, dataValue]);
    
    runVarModule(mData, undefined, undefined, pipe);

    const outValue = root.nodeData[dataVar] as Record<string, unknown>;
    t.truthy(outValue);
    t.is(outValue.testvalue, 'value');
});

test('[unit] VarModule compiles multiple data', t => {
    const mData = new MDataNode(MimeType.JSON);
    mData.setAttribute('test1', 'test1.json');
    mData.setAttribute('test2', 'test2.json');

    const root = new DocumentNode();
    root.appendChild(mData);

    const pipe = new MockPipeline();
    pipe.mockRawTexts.push(['test1.json', MimeType.JSON, '{ "testvalue": "value1" }']);
    pipe.mockRawTexts.push(['test2.json', MimeType.JSON, '{ "testvalue": "value2" }']);
    
    runVarModule(mData, undefined, undefined, pipe);

    const test1 = root.nodeData.test1 as Record<string, unknown>;
    t.truthy(test1);
    t.is(test1.testvalue, 'value1');

    const test2 = root.nodeData.test2 as Record<string, unknown>;
    t.truthy(test2);
    t.is(test2.testvalue, 'value2');
});