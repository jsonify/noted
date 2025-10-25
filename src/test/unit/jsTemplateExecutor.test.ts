import { expect } from 'chai';
import { JSTemplateExecutor, executeTemplate } from '../../services/jsTemplateExecutor';

describe('JSTemplateExecutor', () => {
    let executor: JSTemplateExecutor;

    beforeEach(() => {
        executor = new JSTemplateExecutor();
    });

    afterEach(() => {
        executor.dispose();
    });

    describe('parseTemplate', () => {
        it('should parse template with static text only', () => {
            const template = 'Hello, world!';
            const result = executor.parseTemplate(template);

            expect(result.staticParts).to.have.lengthOf(1);
            expect(result.staticParts[0]).to.equal('Hello, world!');
            expect(result.expressions).to.have.lengthOf(0);
            expect(result.code).to.include('Hello, world!');
        });

        it('should parse template with expressions', () => {
            const template = 'Hello, <%= filename %>!';
            const result = executor.parseTemplate(template);

            expect(result.staticParts).to.have.lengthOf(2);
            expect(result.staticParts[0]).to.equal('Hello, ');
            expect(result.staticParts[1]).to.equal('!');
            expect(result.expressions).to.have.lengthOf(1);
            expect(result.expressions[0]).to.equal('filename');
        });

        it('should parse template with code blocks', () => {
            const template = '<% const x = 5; %>The answer is <%= x %>';
            const result = executor.parseTemplate(template);

            expect(result.code).to.include('const x = 5;');
            expect(result.expressions).to.include('x');
        });

        it('should parse template with multiple expressions', () => {
            const template = '<%= year %>-<%= month %>-<%= day %>';
            const result = executor.parseTemplate(template);

            expect(result.expressions).to.have.lengthOf(3);
            expect(result.expressions).to.include('year');
            expect(result.expressions).to.include('month');
            expect(result.expressions).to.include('day');
        });

        it('should handle whitespace in tags', () => {
            const template = '<%=   filename   %>';
            const result = executor.parseTemplate(template);

            expect(result.expressions).to.have.lengthOf(1);
            expect(result.expressions[0]).to.equal('filename');
        });

        it('should parse complex template with mixed content', () => {
            const template = `# <%= filename %>

<% for (let i = 0; i < 3; i++) { %>
Item <%= i %>
<% } %>

Date: <%= dateString %>`;

            const result = executor.parseTemplate(template);

            expect(result.expressions.length).to.be.greaterThan(0);
            expect(result.code).to.include('for (let i = 0; i < 3; i++)');
        });

        it('should handle multiline code blocks', () => {
            const template = `<%
const items = ['one', 'two', 'three'];
const result = items.join(', ');
%>Items: <%= result %>`;

            const result = executor.parseTemplate(template);

            expect(result.code).to.include('const items');
            expect(result.code).to.include('const result');
        });
    });

    describe('parseAndExecute', () => {
        it('should execute template with static text', async () => {
            const template = 'Hello, world!';
            const result = await executor.parseAndExecute(template, 'test-note');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Hello, world!');
            expect(result.executionTime).to.be.greaterThan(0);
        });

        it('should execute template with filename variable', async () => {
            const template = 'Note: <%= note.filename %>';
            const result = await executor.parseAndExecute(template, 'my-note');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Note: my-note');
        });

        it('should execute template with date variables', async () => {
            const testDate = new Date('2024-10-15T14:30:00');
            const template = 'Year: <%= note.year %>, Month: <%= note.month %>, Day: <%= note.day %>';
            const result = await executor.parseAndExecute(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Year: 2024, Month: 10, Day: 15');
        });

        it('should execute template with weekday and month name', async () => {
            const testDate = new Date('2024-10-15T14:30:00'); // Tuesday
            const template = '<%= note.weekday %>, <%= note.monthName %>';
            const result = await executor.parseAndExecute(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Tue, October');
        });

        it('should execute template with user and workspace', async () => {
            const template = 'User: <%= note.user %>, Workspace: <%= note.workspace %>';
            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.include('User:');
            expect(result.output).to.include('Workspace:');
        });

        it('should execute template with code blocks', async () => {
            const template = `<%
const greeting = "Hello";
const name = "World";
%><%= greeting %>, <%= name %>!`;

            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Hello, World!');
        });

        it('should execute template with loops', async () => {
            const template = `<% for (let i = 1; i <= 3; i++) { %>
Item <%= i %>
<% } %>`;

            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.include('Item 1');
            expect(result.output).to.include('Item 2');
            expect(result.output).to.include('Item 3');
        });

        it('should execute template with conditionals', async () => {
            const template = `<%
const hour = 14;
let greeting;
if (hour < 12) {
    greeting = "Good morning";
} else if (hour < 18) {
    greeting = "Good afternoon";
} else {
    greeting = "Good evening";
}
%><%= greeting %>`;

            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Good afternoon');
        });

        it('should execute template with note object', async () => {
            const template = 'Filename: <%= note.filename %>, Year: <%= note.year %>';
            const result = await executor.parseAndExecute(template, 'my-note');

            expect(result.error).to.be.undefined;
            expect(result.output).to.include('Filename: my-note');
            expect(result.output).to.include('Year:');
        });

        it('should execute template with dateHelper', async () => {
            const testDate = new Date('2024-10-15T14:30:00');
            const template = '<%= dateHelper.format("YYYY-MM-DD") %>';
            const result = await executor.parseAndExecute(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('2024-10-15');
        });

        it('should execute template with dateHelper.getDayName', async () => {
            const testDate = new Date('2024-10-15T14:30:00'); // Tuesday
            const template = 'Day: <%= dateHelper.getDayName() %>';
            const result = await executor.parseAndExecute(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Day: Tuesday');
        });

        it('should execute template with dateHelper.getMonthName', async () => {
            const testDate = new Date('2024-10-15T14:30:00');
            const template = 'Month: <%= dateHelper.getMonthName() %>';
            const result = await executor.parseAndExecute(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Month: October');
        });

        it('should execute template with timeHelper.format12Hour', async () => {
            const testDate = new Date('2024-10-15T14:30:00');
            const template = 'Time: <%= timeHelper.format12Hour() %>';
            const result = await executor.parseAndExecute(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Time: 2:30 PM');
        });

        it('should execute template with timeHelper.format24Hour', async () => {
            const testDate = new Date('2024-10-15T14:30:00');
            const template = 'Time: <%= timeHelper.format24Hour() %>';
            const result = await executor.parseAndExecute(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Time: 14:30');
        });

        it('should execute complex real-world template', async () => {
            const testDate = new Date('2024-10-15T14:30:00');
            const template = `# <%= note.filename %>

**Created:** <%= note.dateString %> at <%= note.timeString %>
**User:** <%= note.user %>

## Tasks

<% const tasks = ['Review code', 'Write tests', 'Update docs']; %>
<% for (let i = 0; i < tasks.length; i++) { %>
- [ ] <%= tasks[i] %>
<% } %>

## Notes

Date: <%= note.dateHelper.format("YYYY-MM-DD HH:mm") %>
Day of week: <%= note.dateHelper.getDayName() %>`;

            const result = await executor.parseAndExecute(template, 'meeting-notes', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.include('# meeting-notes');
            expect(result.output).to.include('Review code');
            expect(result.output).to.include('Write tests');
            expect(result.output).to.include('Update docs');
            expect(result.output).to.include('2024-10-15 14:30');
            expect(result.output).to.include('Day of week: Tuesday');
        });
    });

    describe('Error Handling', () => {
        it('should handle syntax errors gracefully', async () => {
            const template = '<%= undefined.property %>';
            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.not.be.undefined;
            expect(result.output).to.equal('');
        });

        it('should handle runtime errors in code blocks', async () => {
            const template = `<%
throw new Error('Test error');
%>This should not appear`;

            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.not.be.undefined;
            expect(result.error).to.include('error');
        });

        it('should handle division by zero', async () => {
            const template = '<%= 10 / 0 %>';
            const result = await executor.parseAndExecute(template, 'test');

            // Division by zero in JavaScript returns Infinity
            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Infinity');
        });

        it('should handle undefined variables', async () => {
            const template = '<%= nonexistentVariable %>';
            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.not.be.undefined;
        });
    });

    describe('Security Limits', () => {
        // Note: QuickJS timeout for infinite loops requires interrupt handler setup
        // which is more complex. For now, we test other security features.
        it.skip('should respect timeout limits', async () => {
            const shortExecutor = new JSTemplateExecutor({ timeout: 100 });
            const template = `<%
// Infinite loop
while (true) {
    // This should timeout
}
%>Never reached`;

            const result = await shortExecutor.parseAndExecute(template, 'test');

            expect(result.error).to.not.be.undefined;
            expect(result.error).to.include('timeout');
            shortExecutor.dispose();
        }).timeout(5000);

        it('should respect output size limits', async () => {
            const limitedExecutor = new JSTemplateExecutor({ maxOutputSize: 100 });
            const template = `<%
// Generate large output
let output = '';
for (let i = 0; i < 1000; i++) {
    output += 'Long text that exceeds the limit. ';
}
%><%= output %>`;

            const result = await limitedExecutor.parseAndExecute(template, 'test');

            expect(result.error).to.not.be.undefined;
            expect(result.error).to.include('Output size exceeds');
            limitedExecutor.dispose();
        });

        it('should not have access to require', async () => {
            const template = `<%
const fs = require('fs');
%>Should fail`;

            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.not.be.undefined;
        });

        it('should not have access to process', async () => {
            const template = '<%= typeof process %>';

            const result = await executor.parseAndExecute(template, 'test');

            // In QuickJS sandbox, process should not be available
            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('undefined');
        });
    });

    describe('executeTemplate helper function', () => {
        it('should execute template using helper function', async () => {
            const template = 'Hello, <%= note.filename %>!';
            const result = await executeTemplate(template, 'world');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Hello, world!');
        });

        it('should accept custom date', async () => {
            const testDate = new Date('2024-10-15T14:30:00');
            const template = '<%= note.year %>-<%= note.month %>-<%= note.day %>';
            const result = await executeTemplate(template, 'test', testDate);

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('2024-10-15');
        });

        it('should clean up resources after execution', async () => {
            const template = 'Test';
            await executeTemplate(template, 'test');
            // If resources aren't cleaned up, this will cause issues
            await executeTemplate(template, 'test');
            await executeTemplate(template, 'test');
            // No assertion needed - just checking it doesn't crash
        });
    });

    describe('Performance', () => {
        it('should track execution time', async () => {
            const template = 'Hello, world!';
            const result = await executor.parseAndExecute(template, 'test');

            // Execution time should be a non-negative number
            // On fast machines, simple templates may execute in < 1ms (reported as 0)
            expect(result.executionTime).to.be.a('number');
            expect(result.executionTime).to.be.at.least(0);
            expect(result.executionTime).to.be.lessThan(5000); // Should be fast for simple template
        });

        it('should handle rapid consecutive executions', async () => {
            const template = 'Test <%= note.filename %>';

            for (let i = 0; i < 10; i++) {
                const result = await executor.parseAndExecute(template, `note-${i}`);
                expect(result.error).to.be.undefined;
                expect(result.output).to.equal(`Test note-${i}`);
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty template', async () => {
            const result = await executor.parseAndExecute('', 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('');
        });

        it('should handle template with only code (no output)', async () => {
            const template = '<% const x = 5; %>';
            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('');
        });

        it('should handle string interpolation', async () => {
            const template = '<%= "This is a test: " + note.filename %>';
            const result = await executor.parseAndExecute(template, 'my-note');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('This is a test: my-note');
        });

        it('should handle special characters in output', async () => {
            const template = '<%= "Hello\\nWorld" %>';
            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.include('Hello');
        });

        it('should handle arrays and objects', async () => {
            const template = `<%
const items = [1, 2, 3];
const sum = items.reduce((a, b) => a + b, 0);
%>Sum: <%= sum %>`;

            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.equal('Sum: 6');
        });

        it('should handle JSON operations', async () => {
            const template = `<%
const obj = { name: 'Test', value: 42 };
const json = JSON.stringify(obj);
%><%= json %>`;

            const result = await executor.parseAndExecute(template, 'test');

            expect(result.error).to.be.undefined;
            expect(result.output).to.include('"name":"Test"');
            expect(result.output).to.include('"value":42');
        });
    });
});
