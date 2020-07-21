import test from 'ava';
import { comparePageMacro, compareFragmentMacro } from '../_util/htmlCompare';

test('[endToEnd] m-if works at the root context', comparePageMacro,
`<!DOCTYPE html>
<html>
    <head></head>
    <body>
        <m-if ?="{{ true }}">
            <div class="good"></div>
        </m-if>
        <m-if ?="{{ false }}">
            <div class="bad"></div>
        </m-if>
    </body>
</html>`,
'<!DOCTYPE html><html><head></head><body><div class="good"></div></body></html>');

test('[endToEnd] m-if works with truthy and falsy values', comparePageMacro,
`<!DOCTYPE html>
<html>
    <head></head>
    <body>
        <m-if ?="{{ 1 }}">
            <div class="good"></div>
        </m-if>
        <m-if ?="{{ 0 }}">
            <div class="bad"></div>
        </m-if>
    </body>
</html>`,
'<!DOCTYPE html><html><head></head><body><div class="good"></div></body></html>');

test('[endToEnd] m-if works with vars', comparePageMacro,
`<!DOCTYPE html>
<html>
    <head></head>
    <body>
        <m-var test="{{ true }}" />
        <m-if ?="{{ $.test }}">
            <div class="good"></div>
        </m-if>
        <m-if ?="{{ !$.test }}">
            <div class="bad"></div>
        </m-if>
    </body>
</html>`,
'<!DOCTYPE html><html><head></head><body><div class="good"></div></body></html>');

test('[endToEnd] m-if works when nested', comparePageMacro,
`<!DOCTYPE html>
<html>
    <head></head>
    <body>
        <m-if ?="{{ true }}">
            <m-if ?="{{ true }}">
                <div class="good"></div>
            </m-if>
            <m-if ?="{{ false }}">
                <div class="bad"></div>
            </m-if>
        </m-if>
        <m-if ?="{{ false }}">
            <div class="bad"></div>
        </m-if>
    </body>
</html>`,
'<!DOCTYPE html><html><head></head><body><div class="good"></div></body></html>');

test('[endToEnd] m-if respects scopes', compareFragmentMacro,
`<m-var test="{{ true }}" />
<m-scope test="{{ false }}">
    <m-if ?="{{ $.test }}">bad</m-if>
    <m-if ?="{{ !$.test }}">good</m-if>
</m-scope>`,
'good');

test('[endToEnd] m-if works in a fragment', compareFragmentMacro,
`<m-fragment src="child.html" test="{{ true }}" />`,
'good',
[['child.html', `
    <m-if ?="{{ $.test }}">good</m-if>
    <m-if ?="{{ !$.test }}">bad</m-if>
`]]);

test('[endToEnd] m-if works in a component', compareFragmentMacro,
`<m-component src="comp.html" />`,
'good',
[['comp.html',`
    <template>
        <m-if ?="{{ $.test }}">good</m-if>
        <m-if ?="{{ !$.test }}">bad</m-if>
    </template>
    <script>
        return class Comp {
            constructor(scope) {
                this.test = true;
            }
        }
    </script>
`]]);
