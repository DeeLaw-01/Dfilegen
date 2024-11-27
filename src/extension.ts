// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


function createStructure(data: string, baseFolderPath: string) {
	// Stack to keep track of folder hierarchy
	const stack: { path: string; indentLevel: number }[] = [{ path: baseFolderPath, indentLevel: -1 }];

	const lines = data.split('\n');

	lines.forEach(line => {
		const trimmedLine = line.trim();
		const indentLevel = getIndentLevel(line);

		if (trimmedLine) {
			// Ensure the stack is at the correct level
			while (stack.length > 0 && stack[stack.length - 1].indentLevel >= indentLevel) {
				stack.pop(); // Remove folders that are no longer parents
			}

			// Get the parent directory from the stack
			const parentPath = stack[stack.length - 1]?.path || baseFolderPath;
			const targetPath = path.join(parentPath, trimmedLine);

			if (trimmedLine.endsWith('/')) {
				// It's a folder
				if (!fs.existsSync(targetPath)) {
					fs.mkdirSync(targetPath);
				}
				// Push the folder to the stack
				stack.push({ path: targetPath, indentLevel });
			} else {
				// It's a file
				if (!fs.existsSync(targetPath)) {
					fs.writeFileSync(targetPath, '');
				}
			}
		}
	});
	//Show Success message
	vscode.window.showInformationMessage('Folder structure generated successfully!');
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		'd.createFolderStructure',
		async (uri: vscode.Uri | undefined) => {
			let filePath: string | undefined;
			let baseFolderPath: string | undefined;

			if (uri) {
				// Right-click invocation
				filePath = uri.fsPath;
				baseFolderPath = path.dirname(filePath);
			} else {
				// Command palette invocation
				const fileUris = await vscode.window.showOpenDialog({
					canSelectMany: false,
					filters: { Text: ['txt'] },
					openLabel: 'Select .txt File',
				});

				if (!fileUris || fileUris.length === 0) {
					vscode.window.showErrorMessage('No file selected.');
					return;
				}

				filePath = fileUris[0].fsPath;

				const folderUris = await vscode.window.showOpenDialog({
					canSelectFiles: false,
					canSelectFolders: true,
					canSelectMany: false,
					openLabel: 'Select Destination Folder',
				});

				if (!folderUris || folderUris.length === 0) {
					vscode.window.showErrorMessage('No destination folder selected.');
					return;
				}

				baseFolderPath = folderUris[0].fsPath;
			}

			// Ensure the file exists and is readable
			if (!filePath || !fs.existsSync(filePath)) {
				vscode.window.showErrorMessage('Invalid or missing file.');
				return;
			}

			// Read the file
			fs.readFile(filePath, 'utf-8', (err, data) => {
				if (err) {
					vscode.window.showErrorMessage('Failed to read the file.');
					return;
				}

				// Parse the file content and create the structure
				createStructure(data, baseFolderPath!);
			});
		}
	);

	context.subscriptions.push(disposable);
}


function getIndentLevel(line: string): number {
	// Count leading tabs or spaces
	let count = 0;
	while (line[count] === '\t' || line[count] === ' ') {
		count++;
	}
	return count;
}


export function deactivate() { }

