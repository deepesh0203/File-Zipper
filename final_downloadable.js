//min heap data structure

let extension = "";
function heapify(arr, size, i) {
    let l = 2 * i;
    let r = 2 * i + 1;
    let smallest = i;

    if (l <= size && arr[l][1] < arr[smallest][1]) {
        smallest = l;
    }
    if (r <= size && arr[r][1] < arr[smallest][1]) {
        smallest = r;
    }

    if (smallest !== i) {
        let x = arr[smallest];
        arr[smallest] = arr[i];
        arr[i] = x;

        heapify(arr, size, smallest);
    }
}

function heap_util(arr, size) {
    let n = size - 1;
    for (let i = n; i >= 1; i--) {
        heapify(arr, n, i);
    }
}

function getmin(arr) {
    let size = arr.length - 1;
    let min = arr[1];
    arr[1] = arr[size];
    arr.pop();
    size = size - 1;
    heap_util(arr, size);
    return min;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//required modules
const AdmZip = require("adm-zip");
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const archiver = require("archiver");
const flash = require("connect-flash");
const session = require("express-session");
const path = require("path")
const mammoth = require('mammoth');
const officegen = require('officegen');
const docx = officegen('docx')









//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

//initialisation
const app = express();
const port = 4000;
app.use(
    session({ secret: "secret", resave: true, saveUninitialized: true })
);


app.use(flash());

app.use(express.urlencoded({ extended: true }));

let name = [];

app.set("view engine", "ejs");

app.use(express.static("public"));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});


const upload = multer({ storage: storage });


//necessary routes

app.get("/home", (req, res) => {
    const filesize = req.flash("size");
    console.log(filesize)
    res.render("option", { filesize });
});

app.post("/home", (req, res) => {
    const { choice } = req.body;
    if (choice === "compress") {
        res.render("upload");
    } else if (choice === "decompress") {
        res.render("decompress");
    }
});



//TXT related
app.post("/txt", upload.array("file"), (req, res) => {
    name = req.files;
    extension = name[0].originalname.split('.').pop();
    let size = 0;
    for (let file of name) {
        size += file.size;
    }

    if (size === 0) {
        size = 1
        req.flash("size", size);
        res.redirect("/home");

    }
    else if (size < 20000000) {
        compress();
        res.render("downloadpage");
    } else {
        req.flash("size", size);
        res.redirect("/home");
    }
});


app.get("/encode/downloaded", (req, res) => {
    res.download('./compressed.zip')
})
app.get("/decompress", (req, res) => {
    res.render("decompress.ejs");
});


app.post("/decompress", upload.single("file"), (req, res) => {
    decompress(req.file.filename);
    res.render("decompressedDownloadpage");
});

app.get('/decompressed/download', (req, res) => {
    res.download(`./decompressed.${extension}`)

})


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// function to compress text files

async function compress() {
    class Node {
        constructor(left = null, right = null) {
            this.left = left;
            this.right = right;
        }
    }

    let dictionary = {};

    function huffmanCode(node, binary = "") {
        if (typeof node === "string") {
            return { [node]: binary };
        } else {
            const left = node.left;
            const right = node.right;
            Object.assign(dictionary, huffmanCode(left, binary + "0"));
            Object.assign(dictionary, huffmanCode(right, binary + "1"));
        }
        return dictionary;
    }

    let frequency = [[undefined, undefined]];
    let word = "";

    if (extension != 'docx') {
        for (let i = 0; i < name.length; i++) {

            word = word + fs.readFileSync(`uploads/${name[i].originalname}`, "utf-8");
        }
    }
    else {

        async function processFiles() {
            let x = ""
            for (let i = 0; i < name.length; i++) {

                let data = fs.readFileSync(`uploads/${name[i].originalname}`, 'binary');

                try {
                    let result = await mammoth.extractRawText({ buffer: data });
                    let text = result.value.trim();
                    x = x + text;
                } catch (error) {
                    console.error('Error extracting text:', error);
                }
            }

            return x


        }
        word = await processFiles()
    }

    for (const letter of word) {
        let found = false;

        for (let i = 0; i < frequency.length; i++) {
            if (frequency[i][0] === letter) {
                frequency[i][1] += 1;
                found = true;
                break;
            }
        }

        if (!found) {
            frequency.push([letter, 1]);
        }
    }




    let nodes = frequency;

    while (nodes.length > 2) {
        //using the heaps get min function
        const [key1, code1] = getmin(nodes);
        const [key2, code2] = getmin(nodes);

        const n = new Node(key1, key2);
        nodes.push([n, code1 + code2]);
        heap_util(nodes, nodes.length);
    }


    const code = huffmanCode(nodes[1][0]);
    let coded = "";

    for (const letter of word) {
        coded += code[letter];
    }

    //converting the strings of one and zeros to binary
    const binaryArray = binaryStringToUint8Array(coded);

    //writing the binaryarray to .bin file
    fs.writeFileSync("compressed/binary_data.bin", binaryArray);

    //writing the huffmantree to json file
    fs.writeFileSync("compressed/data.json", JSON.stringify(nodes, null, 4));

    const outputFilePath = "compressed.zip";
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
        console.log("Compression complete!");
    });

    archive.on("error", (err) => {
        throw err;
    });

    archive.pipe(output);
    archive.directory("compressed/", false);
    archive.finalize();


    //the function which converts string of ones and zero to binary array

    function binaryStringToUint8Array(binaryString) {
        const length = binaryString.length;
        const uint8Array = new Uint8Array(length / 8);

        for (let i = 0; i < length; i += 8) {
            const byteString = binaryString.substr(i, 8);
            const byteValue = parseInt(byteString, 2);
            uint8Array[i / 8] = byteValue;
        }

        return uint8Array;
    }
}




///////////////////////////////////////////// /////////////////////////////////////////// /////////////////////////////////////////// /////////////////////////////////////////// ////////////////////////////////////////
// function to decompress text files
function decompress(compressedfilename) {
    function decode(code, node) {
        let head = node;
        let ans = "";
        let i = 0;

        while (i < code.length + 1) {
            if (typeof node === "string") {
                ans += node;
                node = head;
            } else {
                if (i < code.length) {
                    if (code[i] === "0") {
                        node = node.left;
                    } else {
                        node = node.right;
                    }
                }
                i++;
            }
        }
        return ans;
    }

    function readBinaryFile(filename, callback) {
        fs.readFile(filename, (err, data) => {
            if (err) {
                console.error("Error reading file:", err);
                return;
            }

            const binaryArray = Uint8Array.from(data);
            const binaryString = uint8ArrayToBinaryString(binaryArray);
            callback(binaryString);
        });
    }

    function uint8ArrayToBinaryString(uint8Array) {
        let binaryString = "";
        const length = uint8Array.length;

        for (let i = 0; i < length; i++) {
            const byte = uint8Array[i];
            const byteString = byte.toString(2).padStart(8, "0");
            binaryString += byteString;
        }

        return binaryString;
    }

    function unzipFile(zipFilePath, destinationPath) {
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(destinationPath, true);
        console.log("Unzipping complete!");
    }

    const compressedFilePath = `uploads/${compressedfilename}`;
    const extractionPath = "unzipped";

    unzipFile(compressedFilePath, extractionPath);

    const filename = "unzipped/binary_data.bin";

    readBinaryFile(filename, (binaryString) => {
        const tree = fs.readFileSync("unzipped/data.json");
        const tree_parsed = JSON.parse(tree);

        const decoded = decode(binaryString, tree_parsed[1][0]);
        let newname = "decompressed." + extension

        if (extension != "docx") {
            fs.writeFileSync(newname, decoded);
        }

        else {


            const p = docx.createP()
            p.addText(decoded)
            const out = fs.createWriteStream(newname)
            docx.generate(out)
        }
    });
}
// /////////////////////////////////////////// /////////////////////////////////////////// /////////////////////////////////////////// /////////////////////////////////////////// /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Node {
    constructor(key = null, value = null) {
        this.key = key;
        this.value = value;
        this.next = null;
    }
}

class hashTable {
    constructor() {
        this.table = Array(71).fill(new Node());
    }

    hash(key) {
        const charCode = key.charCodeAt(0);
        return charCode % 71;
    }

    set(key, value) {
        const place = this.hash(key);
        let cur = this.table[place];

        while ((cur.next !== null)) {
            if (cur.key === key) {
                cur.value = value;
                return
            } else {
                cur = cur.next;
            }
        }
        cur.next = new Node(key, value);
    }

    get(key) {
        const place = this.hash(key);
        let cur = this.table[place];

        while (cur.next !== null) {
            cur = cur.next;
            if (cur.key === key) {
                return cur.value;
            }
        }
        return null
    }
}

const h = new hashTable();

function calculateLetterFrequencies(word) {




    // Iterate over each character in the word
    for (let i = 0; i < word.length; i++) {
        letter = word[i]
        // Increment the frequency count for the letter in the hash table
        if (h.get(letter)) {
            h.set(letter, h.get(letter) + 1);
        } else {
            h.set(letter, 1);
        }
    }



}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
