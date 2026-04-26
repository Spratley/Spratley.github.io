import json
import html
import markdown
import tree_sitter_cpp as tscpp
from pathlib import Path
from bs4 import BeautifulSoup
from tree_sitter import Language, Parser

# -=-=-=-= Constants =-=-=-=-
CPP_LANGUAGE = Language(tscpp.language())
CLASS_MAP = {
    "primitive_type": "type",
    "type_identifier": "type",
    "namespace_identifier": "namespace",
    "class_name": "type",
    "field_identifier": "property",
    "function_declarator": "function",
    "parameter_declaration": "variable",
    "number_literal": "number",
    "string_literal": "string",
    "system_lib_string": "string",
    "char_literal": "string",
    "comment": "comment",
    "preproc_directive": "keyword",
}

KEYWORDS = {
    "control": {"return", "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue"},
    "memory": {"new", "delete"},
    "misc": {"const_cast", "static_cast", "dynamic_cast", "reinterpret_cast", "std", "const", "volatile", "mutable", "static", "inline", "unsigned", "signed"}
}

BUILTIN_TYPES = {"char", "int", "float", "double", "void", "bool", "size_t"}

# -=-=-=-= Classes =-=-=-=-
class CppHighlighter:
    def __init__(self):
        self.parser = Parser(CPP_LANGUAGE)

    def Highlight(self, codeText):
        tree = self.parser.parse(bytes(codeText, "utf8"))
        highlights = []
        self.CollectHighlights(tree.root_node, codeText, highlights)
        
        # Sort by start position
        highlights.sort()

        # Rebuild the text
        result = []
        lastIdx = 0
        codeBytes = bytes(codeText, "utf8")

        for start, end, className in highlights:
            if start < lastIdx:
                continue
            
            # Text between highlights
            result.append(html.escape(codeBytes[lastIdx:start].decode("utf8", errors="ignore")))
            
            # Highlighted span
            nodeContent = html.escape(codeBytes[start:end].decode("utf8", errors="ignore"))
            result.append(f'<span class="hc-{className}">{nodeContent}</span>')
            lastIdx = end

        result.append(html.escape(codeBytes[lastIdx:].decode("utf8", errors="ignore")))
        innerHtml = "".join(result)
        return f'<pre class="demo-code"><code>{innerHtml}</code></pre>'

    def CollectHighlights(self, node, codeText, highlights):
        nodeText = codeText[node.start_byte:node.end_byte]
        assignedClass = None

        # 1. Keyword Check
        if nodeText in KEYWORDS["control"]:
            assignedClass = "control-keyword"
        elif nodeText in KEYWORDS["memory"]:
            assignedClass = "memory-keyword"
        elif nodeText in KEYWORDS["misc"]:
            assignedClass = "keyword"
        elif nodeText in BUILTIN_TYPES:
            assignedClass = "type"

        # 2. Identifier Context Logic
        elif node.type in {"identifier", "field_identifier"}:
            assignedClass = self.ResolveIdentifierClass(node)

        # 3. Fallback to Map
        elif node.type in CLASS_MAP:
            assignedClass = CLASS_MAP[node.type]

        if assignedClass:
            highlights.append((node.start_byte, node.end_byte, assignedClass))

        for child in node.children:
            self.CollectHighlights(child, codeText, highlights)

    def ResolveIdentifierClass(self, node):
        parent = node.parent
        if not parent:
            return "variable"

        # Macro handling
        if parent.type in {"preproc_function_def", "preproc_def"}:
            if node == parent.child_by_field_name("name"):
                return "macro"

        if parent.type == "field_expression":
            if node == parent.child_by_field_name("field"):
                grandparent = parent.parent
                if grandparent and grandparent.type in {"call_expression", "template_function"}:
                    return "function"
                return "property"

        # Contextual walk-up
        curr = parent
        while curr:
            if curr.type in {"compound_statement", "declaration_list", "expression_statement", "parameter_list"}:
                break

            if curr.type in {"call_expression", "template_function"}:
                callee = curr.child_by_field_name("function")
                
                # If the identifier is part of the function name (like 'make_tuple' in 'std::make_tuple')
                # but NOT the base of a field expression (which we handled above)
                if callee and node.parent == callee and node.parent.type != "field_expression":
                    return "function"
                
                # Direct call: func()
                if node == callee:
                    return "function"

            if curr.type in {"function_declarator", "field_declaration"}:
                if any(child.type == "parameter_list" for child in curr.children):
                    return "function"

            curr = curr.parent
        
        return "variable"

class PostGenerator:
    def __init__(self, templatePath):
        with open(templatePath, "r", encoding="utf-8") as file:
            self.template = file.read()
        self.highlighter = CppHighlighter()
        self.postsMetadata = []

    def ParseMetadata(self, contents):
        metadata = {}
        lines = contents.splitlines()
        contentIdx = 0
        
        for i, line in enumerate(lines):
            if line.startswith("<") and ":" in line and line.endswith(">"):
                key, val = line[1:-1].split(":", 1)
                metadata[key.strip()] = val.strip()
                contentIdx = i + 1
            else:
                break
        return metadata, "\n".join(lines[contentIdx:])

    def ProcessFile(self, filePath):
        print(f"Generating post for {filePath.name}...")
        with open(filePath, "r", encoding="utf-8") as f:
            rawText = f.read()

        metadata, body = self.ParseMetadata(rawText)
        
        # Build Markdown Source
        mdSource = []
        if "Title" in metadata: mdSource.append(f"# {metadata['Title']}")
        if "Date" in metadata: mdSource.append(metadata["Date"])
        mdSource.append(body)
        if "Tags" in metadata:
            tagLine = " ".join([f"`MetaTag_{t.strip()}`" for t in metadata["Tags"].split(",")])
            mdSource.append(f"\n\n{tagLine}")

        htmlOutput = markdown.markdown("\n\n".join(mdSource), extensions=['fenced_code'])

        # Put the date in Japanese format because I'm a weeb
        if "Date" in metadata and "-" in metadata["Date"]:
            y, m, d = metadata["Date"].split("-")
            htmlOutput = htmlOutput.replace(metadata["Date"], f"{y}年{m}月{d}日")

        soup = BeautifulSoup(htmlOutput, "html.parser")

        # Syntax Highlighting
        for codeBlock in soup.find_all("code", id=False):
            if codeBlock.parent.name == "pre":
                highlighted = self.highlighter.Highlight(codeBlock.get_text())
                codeBlock.parent.replace_with(BeautifulSoup(highlighted, "html.parser"))

        # Tag linking
        if "Tags" in metadata:
            for tag in metadata["Tags"].split(","):
                tag = tag.strip()
                placeholder = f"<code>MetaTag_{tag}</code>"
                link = f'<a class="tags" href="../index.html?tag={tag}"><code id="tag">{tag}</code></a>'
                # Beautiful soup handles the string conversion here
                htmlOutput = str(soup).replace(placeholder, link)
                soup = BeautifulSoup(htmlOutput, "html.parser")

        # Final Assembly
        finalPage = self.template.replace("{{content}}", str(soup))
        if "Title" in metadata:
            finalPage = finalPage.replace("<title></title>", f"<title>{metadata['Title']}</title>")

        outName = filePath.stem.replace(" ", "+") + ".html"
        with open(Path("..") / outName, "w", encoding="utf-8") as f:
            f.write(finalPage)

        self.postsMetadata.append({
            "title": metadata.get("Title", ""),
            "date": metadata.get("Date", ""),
            "tags": [t.strip() for t in metadata.get("Tags", "").split(",")] if "Tags" in metadata else [],
            "fileName": outName,
            "image": metadata.get("Image", "/Images/Unknown.webp")
        })

# -=-=-=-= Main =-=-=-=-
if __name__ == "__main__":
    generator = PostGenerator("Post_Skeleton.xml")
    
    for sbpFile in Path(".").glob("*.sbp"):
        generator.ProcessFile(sbpFile)

    with open("../../posts.json", "w", encoding="utf-8") as file:
        json.dump(generator.postsMetadata, file, indent=4)