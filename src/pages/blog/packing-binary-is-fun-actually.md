---
layout: ../../layouts/Layout.astro
title: "Packing Binary Is Fun, Actually"
date: 2026-09-24T23:12:00+05:30
description: "I built my own binary serializer and a custom lang. heres how I did it"
---


## Why would anyone do this?
I saw someone on twitter arguing that saving data in JSON was apparently not what Real™ developers do.

Obviously, I had to become a Real™ Developer too.

Turns out, the answer was binary.

Naturally, I had a brilliant idea:

> “How hard could it be to make my own binary format?”

Surely it’s just a little ``wb`` . ( ˶ˆᗜˆ˵ )

It was, unfortunately, not just a ``wb``.

I ended up building an entire binary schema language that can shrink JSON payloads by 80%.

[jBin](https://github.com/PranavDesai-Git/jbin)
## What is binary packing?

Say we got some data
```
"hello world"
```

then it would be translated in ascii to 

```
104 101 108 108 111    32     119 111 114 108 100
 h   e   l   l   o   [SPACE]   w   o   r   l   d
```

So h becomes 104 in ASCII.

Since these ASCII values fit within 8 bits, each character takes up 1 byte.
```
h        e        l
01101000 01100101 01101100 

l        o        [SPACE]
01101100 01101111 00100000 

w        o        r
01110111 01101111 01110010 

l        d
01101100 01100100
```

so we can just write it using a lil bitta c:
```c
FILE *f = fopen("file.bin", "wb");

unsigned char data[] = "hello world";
fwrite(data, 1, sizeof(data) - 1, f);

fclose(f);
```

Simple enough. Now let's try writing 104.

Obviously, we could just write 104 as ASCII characters:
```
'1' '0' '4' → 49 48 52
```
But that's 3 bytes for a number that only needs 1 byte.

So if we want to save those 2 bytes, we need some way of telling the decoder, “hey, this is an integer, not a string.”

You could add a header, you would only be adding an additional byte (well depends on how many types you got.. hopefully you don't have more than 128 types...if you do you got bigger issues. 

great! lets just use the first byte to represent our type and second to represent our data.


```
[TYPE][DATA]
```

say 0 is int and 1 is string so 104 would be

```
00000000 01101000
```

and string would be..
```
00000001 01101000
```


oh wait.....

that would only give is ```h```

we need a way to represent different lengths of data. welp lets just get another byte. that should represent the length of our string.
so now our binary becomes
```
[TYPE][LENGTH][DATA]
```

great! now we can represent our string like this:

```
 [TYPE]  [LENGTH] [DATA]
(STRING)  (11)
00000001 00001011 00...

h        e        l
01101000 01100101 01101100 

l        o        [SPACE]
01101100 01101111 00100000 

w        o        r
01110111 01101111 01110010 

l        d
01101100 01100100
```

GREAT! now we could pack both strings and ints together!
say we wanted to represent ```"userid": 123```

now you could just package it all together
```
[TYPE:STRING][LENGTH:6][WORD:userid][TYPE:INT][LENGTH:-][DATA:123]
```

Great! we can represent 123 as a 1 byte number with 2 bytes of header. 
but notice, we are not really using LENGTH field for ints? why need it then? waste of bytes eh?

WELL... if we get rid of it, how does our binary reader know where the header ends?

It needs some way to say “okay, the header is done, start reading the actual data now.”

huh. what can we use to represent that a byte is ending. 

A length byte for the header, perhaps?

Ehh. That's redundant. We'd be removing the length field just to add another length field.

But hey, we could use a bit in the header itself.

We could have one bit say:
> I am not the last byte in the header. There's more.

You might think: why not use the LSB?

Well, then we'd only be able to represent even numbers. Which is... not ideal.

So we'll use the MSB instead.

so now our tag looks something like this:
```
[CONTINUATION BIT][7 BITS OF DATA]
```

If the continuation bit is 1, there's another header byte.
If it's 0, the header is done.

using this, we can just have our 123 be

```
[TYPE=0][DATA=123]
```


and if its a string.
```
[TYPE=1][LENGTH=11][DATA=104]...
```

so its of type 1, length 11

but wait...what if the length is greater than 127? with 7 bits you can only represent up to 127!

> We use the same thing! but for ints!

if the first bit is 1 then the int continues.
128 can be written as:

```
10000001 00000000
^
MSB / continuation bit
```

(in big endian)

what the binary reader will do:

- Reads the first byte.
- The MSB is 1, so there's another byte.
- The remaining 7 bits are 1.
- Reads the second byte.
- Its MSB is 0, so this is the last byte.
- Its remaining 7 bits are 0.
- Combines the two 7-bit values to get 128.

This is a kind of varint (variable-length integer).

The encoding we're using here is little-endian: the least-significant 7 bits come first.

```
10000000 00000001
```

Hey this is great, innit? You can represent different types  in the same binary and your binary parser will read them all correctly

But notice, We are storing this data per field.

```
[TYPE][DATA]
[TYPE][DATA]
[TYPE][DATA]
```

And most data isn't just a bunch of random values floating around. It's usually structured.

Take a C struct:

```c
struct {
    int i;
    char *s;
    int a[10];
}
```

this would be say on a 32 bit system.
```
[32-bit int] [32-bit pointer] [10 × 32-bit ints]
```
and we didn't have to add headers everytime. because we know the type of the data from the struct itself.

Hmm. I wonder if we can do this for our binary data...

And yes, we can.

That's what a schema is!

so for our struct our schema can just be:
```
i: int
s: char *
a: list(int)
```

The schema lets us know the type without storing the type alongside every value.

now our binary format doesn't need to worry about the type! it only need to worry the size of the data!

> That's what protobuf does

So lets think about all the different sizes of data we can have. 

we got ints, we got floats, bools, strings.

We can treat ints and bools as varints, while floats are fixed-width: f32 or f64.

Strings are different. We can't just encode their bytes as a varint, because the bytes themselves are the actual data we need to preserve.

So instead, we need to know how many bytes belong to the string before we start reading it.

so now our encoding types are:

- varint
- f32
- f64
- delimited

but wait! how do we access our fields? like we cant just go "gimme string" we will need to spacify which one. and no problem lets just represent each one with a number.
we can index them or have the user assign their own numbers to address them. this is what we need field number for.


And notice something else: we only have four possible types.

Four values fit perfectly into 2 bits.
```
00 - varint 
01 - f32
10 - f64
11 - delimited
```


hey isn't that neat. now what we could do is just encode it...*inside our field number!*

> wait how?

some binary trickery..not really. 

You just shove them together.

Move the field number left by 2 bits to make room for our 2-bit type, then OR the type into those empty bits.

say your field number is 10 and it is a delimited type.


```
00001010 (10)

left shift that by 2

00101000

OR it with our type!

00101011
```

LOOK AT THAT! our 1 byte number tells us both what type it is and what its field number is!

But what if we go FURTHER.

We've already packed the type into the field number.

Why stop there?

What if we could pack the length in too?

We can.

now our header can hold
```
[FIELD NUMBER][LENGTH][TYPE]
```

ALL in a singular varint!!!! ◝(ᵔᗜᵔ)◜

Cool. Except for one thing

its just so much tedious work.
To pack a string, I have to tell it ‘this is delimited,’ give it the length, and then give it the bytes. Every. Single. Time.

PEASANTS DO THAT. Plebeians. we don't do that.


So obviously, the solution is to write an entire schema language.
We declare our data in a schema file, and let the program deal with all that tedious formatting and encoding nonsense.

---

## Building the schema syntax

alright soo... we need to decide on a syntax that doesn't suck your soul (looking at you protobuf)


field numbers.. what are they? index right. how do you index stuff in your grocery list? you write number. item
why not use the same!

so something like this:
```
1. name
```

we need the schema to represent the types. lets just steal how other languages do it and do it like this:
```
1. name: type
```

neat huh.
but wait. how do we indicate the end of a message(struct)

well we could do {} but its not very nice is it. why over complicate stuff its a list. lists have an end. lets have an end.


```
message name:
    1. name:type
    2. name:type
    3. name:type
end
```


and no, indentations shouldn't matter. its so annoying to work with languages where indentation matters. its just painful. lets just not do that.

so..how will you identify the end of the line without a semicolon? new line char?

I mean we could do that but what if they wanted to type it in a single line, its ugly but say they want to for whatever reason. lets not restrict that. but semicolons are ugly.

we could use the number!
if we see a number and a dot we just consider it a new entry! 

neat huh.𐔌*ˊᵕˋ*𐦯

problem...what if the field is just not found when the compiler is reading it?
we could crash...and we would for all the fields but we do want optional fields don't we. lets just go with the obvious route and do something like this:
```
    number. name: type = defaultValue
```
and that's optional. pretty intuitive.

now that we are here anyway lets think about all the different kinds of data people could represent...

well we obviously got our entries of types.

oh we would need lists. we need some sort of way to pick between a few things so we would need an enum.
great lets think about those..

oh we could just have them be function like, that's pretty intuitive.
```
    number. name: structure(type)
```
like:
```
    1. friends: list(People)
```

oh wait but what is people? oh it should be a message too. something like this:
```
message People:
    1. name: string
    2. location: string
end
```

huh.. we need custom types as well... so in the language do we want to have everything be in order? ehh that's pretty cringe later we could just do a pass and put together all of our table and just have it refer to that struct.

hey thanks to this we can have self reference as well. cuz when we pack it it will just be a pointer to the struct! so we can do something like:
```
message People:
    1. name: string
    2. location: string
    3. friends: list(People)
```

now for enums. cuz we have two passes we can just put enums outside of message! it doesn't matter where  it is declared either! we can declare our enum something like this:
```
enum Name:
    number. name 
    number. name
    number. name
end
```
also protobuf does this thing where it forces you to have the enum start from 0
like do we REALLY need that? is the compiler so dumb it cant tell? lets just have the compiler handle that by default

oh wait.... people might need some way to represent an enum but all the types are not the same.
yup. that's a union. lets just add that no problemo

```
    number. name: union(type, type, type...)
```


oh wait.. our default value. how would that work with unions.
if we have a union like this:
```
    number. name: union(i32, i64) = 10
```
it is ambiguous weather 10 is an i32 or an i64
so when field is not found what should we do?

we could fix this by having the default be next to the type.
```
    number. name: union(i32 = 10, i64)
```

now if a the field is not found it will be an i32 with value 10

okay well people would wanna map stuff as well...so we add 
```
    number. name: map(key_type, value_type)
```

lets just add syntax for declaring packages and importing stuff:
```
package "package name"
```

```
import "package"
```

hey would you look at that we have some very neat syntax. lets just put it all together:

```
package "com.game.core"
import "math.jbin"

enum Activity:
    1. active
    2. inactive
end

message Player:
    1. name: string
    2. health: i32 = 100
    3. weapons: list(string)
    4. connections: list(Player)
    5. activeStatus: Activity
    6. inventory: map(string, i32)
    7. balance: union(string="empty", i32)
end
```

oh wait...we have a whole language now....


anyway. this is the equivalent of it in .proto
```
syntax = "proto2";

package com.game.core;

import "math.proto";

enum Activity {
  ACTIVE = 1;
  INACTIVE = 2;
}

message Player {
  optional string name = 1;
  optional int32 health = 2 [default = 100];
  
  repeated string weapons = 3;
  repeated Player connections = 4;
  
  optional Activity active_status = 5;
  map<string, int32> inventory = 6;
  
  oneof balance {
    string empty = 7;
    int32 amount = 8;
  }
}
```

look at that. ew.

---

## Time to actually implement this
To implement this I naturally chose C++.

By “naturally,” I mean I wanted something I could put on a resume and wasn't in the mood to fight the Rust borrow checker. I have aged enough.

Okay. Enough designing. Time to actually make the thing work.

First, we need to encode our binary.

### Encoding and Decoding our Data

To encode a varint, it's basically just this:
```cpp
void encodeVariant(std::vector<uint8_t> &buffer, uint64_t value) {
    while (value >= 128) {
        uint8_t lower = value & 127; // 127 = 01111111
        lower |= 128;
        buffer.push_back(lower);
        value >>= 7;
    }
    uint8_t lower = value & 127;
    buffer.push_back(lower);
}
```

This builds our varint. If the value is >= 128, we take the lowest 7 bits, set the MSB to 1 to say “there's more,” and append it to the buffer.

Then we shift the value by 7 bits and repeat.

For the final byte, we leave the MSB at 0.

pretty simple. and we can decode it using this:

```cpp
uint64_t decodeVariant(const std::vector<uint8_t> &buffer, size_t &offset) {
    uint64_t result = 0;
    int shift = 0;
    while ((buffer[offset] & 128) != 0 && offset < buffer.size()) {
        uint8_t byte = buffer[offset++];
        byte &= 127;
        const uint64_t cast = static_cast<uint64_t>(byte) << shift;
        result |= cast;
        shift += 7;
    }
    uint8_t byte = buffer[offset++] & 127;
    const uint64_t cast = static_cast<uint64_t>(byte) << shift;
    result |= cast;
    return result;
}
```

Now that we can encode and decode our varints using LEB128 lets encode and decode some tags(our header metadata we discussed about)

```cpp
void encodeTag(std::vector<uint8_t> &buffer, uint32_t fieldNumber,
               wiretype wiretype) {
    uint64_t val = (static_cast<uint64_t>(fieldNumber) << 2);
    val |= static_cast<uint64_t>(wiretype);
    encodeVariant(buffer, val);
}

void decodeTag(const std::vector<uint8_t> &buffer, size_t &offset,
               uint32_t &outFieldNumber, wiretype &outType) {
    uint64_t val = decodeVariant(buffer, offset);
    outType = static_cast<wiretype>(val & 3);
    outFieldNumber = val >> 2;
}
```


And we can add a couple of helpers for strings:
```cpp
void encodeString(std::vector<uint8_t> &buffer, uint32_t fieldNumber,
                  const std::string &text) {
    encodeTag(buffer, fieldNumber, wiretype::Delimited);
    encodeVariant(buffer, text.size());
    buffer.insert(buffer.end(), text.begin(), text.end());
}

std::string decodeString(const std::vector<uint8_t> &buffer, size_t &offset) {
    uint64_t size = decodeVariant(buffer, offset);
    std::string result =
        std::string(buffer.begin() + offset, buffer.begin() + offset + size);
    offset += size;
    return result;
}
```

Encoding a string is now just three things: write its tag, write its length, then write its bytes.


believe it or not, that's basically all our core engine done! the rest is just the compiler and the json conversion stuff! ٩(^ᗜ^ )و ´-


Great! now that we have written our binary encoding... lets make a compiler should be simple...right?

### Building Compiler

Yes it is a compiler. stop it I don't wanna call it a transpiler it is a compiler. the definition is:


> compiler is a computer program that translates source code written in one programming language (the source language) into another programming language (the target language), while preserving the exact meaning and behavior of the original code.


ours does that. gtfo compiler people. my program takes my schema and translates it into either a binary or code.

#### The problem

Our language is pretty cute. Pretty slick.

Unfortunately, the computer has no idea what any of it means.

It's just bytes.

so lets assign meaning to these symbols!


lets take our syntax:
```
    1. name:string
```
so its in the structure of:
```
number → dot → identifier → colon → type
```
and then we can use this to build our representation of these entries. that's what a Lexer does

#### Building the Lexer


Yes lexer is like what you think it is. its just a big loop with a bunch of if statements.
All it does is read our file and spit out these tokens.(not the ai kind)


```cpp
enum class TokenType {
    Keyword_Message,
    Keyword_Enum,
    Keyword_Optional,
    Keyword_Map,
    Keyword_Union,
    Keyword_End,
    Keyword_Package,
    Keyword_Import,
    Identifier,
    Number,
    StringLiteral,
    Comment,
    Equals,
    Colon,
    Comma,
    Dot,
    LParen,
    RParen,
    EndOfFile
};
```
so our file 

```
message User:
    1. name: string
    2. id: i32
```

the tokenized output would be:
```
    [Keyword_Message]
    [Identifier: "User"]
    [Colon]
    [Number: 1]
    [Dot]
    [Identifier: "name"]
    [Colon]
    [Identifier: "string"]
    [Number: 2]
    [Dot]
    [Identifier: "id"]
    [Colon]
    [Identifier: "i32"]
    [EndOfFile]
```


Pretty neat. Now the parser doesn't have to decipher a bunch of raw characters. It can just work with these tokens.
parser looks at these and then actually emits the AST (abstract syntax tree).


#### What is AST?

Its just how we represent our program data in [graphLang](https://github.com/PranavDesai-Git/graphLang) it was a literal tree node that held all the data and all data was just a single shape.
For this one we can define our schema as the root. we just have two kinds of messages rn messages and enums so our head can be defined as:


```cpp
struct Schema {
    std::vector<EnumDef> enums;
    std::vector<MessageDef> messages;
};
```

so our Schema will be the root node and the tree will look like this:

```
    (Schema)
    /      \
(enums) (messages)
```

#### Building the AST

soo.... what is enums and messages? from the definition above you can see its a vector of structs.
our messages can be defined as:
```cpp
struct MessageDef {
    std::string name;
    std::vector<Field> fields;
    int line = 0;
    std::string comment = "";
};
```

and then our Field as:

```cpp
struct Field {
    uint32_t number;
    std::string name;
    DataType type;
    bool isOptional = false;
    std::string defaultValue = "";
    int line = 0;
    std::string comment = "";
};
```

now our AST looks like this:

```
Schema
└── messages
    └── MessageDef
        ├── name
        ├── line
        ├── comment
        └── fields
            └── Field
                ├── number
                ├── name
                ├── type
                ├── isOptional
                ├── defaultValue
                ├── line
                └── comment
```



and all that's left is our enum definition:
```cpp
struct EnumDef {
    std::string name;
    std::vector<EnumEntry> entries;
    int line = 0;
    std::string comment = "";
};
```

and our enum entry:
```cpp
struct EnumEntry {
    uint32_t number;
    std::string name;
    int line = 0;
    std::string comment = "";
};
```

Great! we got all our pieces. our AST looks like this now:

```
Schema
├── Enums
│   └── EnumDef
│       ├── name
│       └── entries
│           └── EnumEntry
│               ├── number
│               └── name
│
└── Messages
    └── MessageDef
        ├── name
        └── fields
            └── Field
                ├── number
                ├── name
                ├── type
                ├── isOptional
                └── defaultValue
```

#### Building the parser
we use this and build our parser. and yes. our parser is just a loop with if statements (well technically recursive decent or whatever but recursion is just a form of iteration).

it is actually pretty simple the whole loop:
```cpp
Schema Parser::parse() {
    Schema s;
    while (!isAtEnd()) {
        if (peek().type == TokenType::Comment) {
            consume();
            continue;
        }
        if (peek().type == TokenType::Keyword_Package) {
            consume();
            if (peek().type == TokenType::StringLiteral) {
                s.packageName = consume().value;
            } else {
                error("Expected string literal after package");
            }
        } else if (peek().type == TokenType::Keyword_Import) {
            consume();
            if (peek().type == TokenType::StringLiteral) {
                s.imports.push_back(consume().value);
            } else {
                error("Expected string literal after import");
            }
        } else if (peek().type == TokenType::Keyword_Message)
            s.messages.push_back(parseMessage());
        else if (peek().type == TokenType::Keyword_Enum)
            s.enums.push_back(parseEnum());
        else
            error("Unexpected token in global scope");
    }
    return s;
}
```

and for each of the types its just a bunch if conditions checking and then returning the AST node.
``consume()`` returns the current token and moves the pointer over by one and ```peek()``` gives you the next token data without moving the pointer

GREAT! lets test it out.

```
    message User:
        1. name: adfasdfasdfasdfasd
        2. id: 012349
```


lets see what our parser says:

> "Mighty good mate! seems excellent innit? want a cuppa?"

yeah..so we need a thing that checks the user isn't just syntactically correct but also the shit makes sense. 

so we need a fact checker, a twitter community note if you will.

And that's what our semantic analyzer does!


#### Building the Semantic Analyzer


So to validate stuff we will be doing it in two passes. 

- First pass we build all of our symbols and put them into a table. (Basically just all the valid stuff that are identifiable)
- Second pass we use that the table we built validate the AST.

```cpp
void SemanticAnalyzer::analyze(const Schema &schema) {
    buildSymbolTable(schema);
    validateEnums(schema);
    validateMessages(schema);
    validateCyclicDependencies(schema);
}
```

Because we do this in two passes, declaration order doesn't matter. Which is pretty neat.

So during ``validateMessages`` , when it looks at
``adfasdfasdfasdfasd`` , it checks our symbol table,
realizes that type doesn't exist, and throws an error . It also checks
that you didn't do something stupid like use field
number  1  twice, or use a list as a map key.

Great! Look at what we got so far! 

- A Lexer that chops everything up into tokens
- A Parser that takes the tokens and builds the AST
- A Semantic Analyzer that validates the AST and throws errors
- An encoder/decoder using LEB128.

Now all that's left to do is to do two things.

- Convert JSON files into binary dynamically
- Codegen from the schema so they can use them in their language natively

### Dynamic Packer

Now for the dynamic packer. It takes a schema, takes a JSON file, and builds our binary.

For JSON, I just used ``nlohmann/json``. Parsing JSON on top of everything else would've been a completely unnecessary side quest.

So we have our JSON loaded in memory. We have our
AST loaded in memory. Now we just walk them together.

When the JSON parser sees the
key  "id": 123 , it doesn't know what to do. But it
asks the AST! The AST says, 
> "Oh,  id ? That's field number 2, and it's an  i32 ." 

So the Packer just calls our  ``encodeTag()``  and  ``encodeVariant()``
functions and spits the bytes into our buffer.



Notice what we didn't do? We
didn't generate any C++ code. We didn't compile any
wrappers. We just read the JSON, read the schema, and
built the binary dynamically.

take that protobuf

**Lets test it out!**

```json
{
    "name": "Pranav",
    "health": 100
}
```
If we save this as JSON, with spaces and quotes,
it's about 35 bytes


lets pack it in binary.

and that is...

**NINE BYTES**

**hell yeahh look at that!!!**

74.29% REDUCTION


it would be even higher if we didn't have strings and stuff.
6 of the 9 bytes are used for the word "Pranav"
but besides the point. 

we have reduced our size of storage by a LOT.

And decoding is way simpler too. The binary already tells us what each field is supposed to be, so the decoder doesn't have to deal with JSON's syntax and type representation.


But what if you don't want to pay the cost of dynamically looking everything up at runtime? What if you just want normal structs in your language?

That's where AOT code generation comes in.
### Codegen

Hmm... how would one generate code? I mean we have our AST so we know what it looks like and what it is semantically so like its just translating that into our language..

you could write a ``cCodeGen()`` func and add it to our class and call.

if we wanted a generator for python? oh that's easy! i'll just add a ``pythonCodeGen``!

oh I need a ``jsCodeGen()`` okay look. too far. why are you writing javascript. but regardless.

But apparently the customer is always right in their language preferences or whatever.
okay now this class is getting a wee bit too bloated for my liking.

That's exactly why we need a visitor pattern!

#### Visitor Pattern

So what is a visitor? in hindsight, design pattern cope for ones who's language doesn not have algebraic datatypes. So why did I use it even though cpp has the ``std::variant``? Idk I read it in an article once. I wanted ot learn about it.

Anyway. so a visitor pattern is just a lil handshake the caller and callee do. we get type safety from it. in our implementation our caller passes itself in and becomes the visitor. the callee or the acceptor accepts the visitor and does a little func call on the visitor passing itself in triggering a double dispatch. pretty neat..but its just so much mental overhead for a simple problem.

to accomplish this we will need to edit our structs in the ADT to also hold a function.

```cpp
void accept(SchemaVisitor &visitor) const;
```

and we create an abstract class with a bunch of virtual methods that our generators implement:
```cpp
#pragma once
#include "Schema.hpp"

class SchemaVisitor {
  public:
    virtual ~SchemaVisitor() = default;
    virtual void visit(const Schema &s) = 0;
    virtual void visit(const MessageDef &m) = 0;
    virtual void visit(const EnumDef &e) = 0;
    virtual void visit(const EnumEntry &ee) = 0;
    virtual void visit(const Field &f) = 0;
};
```


so our c generator for example looks like this:

```cpp
#pragma once
#include "SchemaVisitor.hpp"
#include <ostream>
#include <string>

class CGenerator : public SchemaVisitor {
  private:
    std::ostream &out;
    std::string currentEnumName;
    const Schema* currentSchema = nullptr;

  public:
    CGenerator(std::ostream &outputStream) : out(outputStream) {}

    void visit(const Schema &schema) override;
    void visit(const MessageDef &message) override;
    void visit(const EnumDef &enumDef) override;
    void visit(const EnumEntry &ee) override;
    void visit(const Field &field) override;
};
```

so our C generator just overrides these funcs and in these visits it does this:
```cpp 
void CGenerator::visit(const EnumDef &enumDef) {
    currentEnumName = enumDef.name;
    out << "typedef enum {\n";
    for (const auto &ee : enumDef.entries) {
        ee.accept(*this);
    }
    out << "} " << enumDef.name << ";\n\n";
}
```

when we do ee.accept(*this) it does this:
```cpp 
void EnumEntry::accept(SchemaVisitor &visitor) const { visitor.visit(*this); }
```
so it just calls CGenerator.visit(ee) so the visit for environment entries is called in CGenerator.

```cpp
void CGenerator::visit(const EnumEntry &ee) {
    out << "    " << currentEnumName << "_" << ee.name << " = " << ee.number << ",\n";
}
```
and this is done for each type. and that's how the code is generated.

GREAT! lets test it out..

oh wait. we cant. we don't have a way to do that. we need a cli.

### Building CLI

For the CLI I used jarro2783/cxxopts cuz I didn't want to do manual parsing. it will be a fun project both this and the json I will do them sometime else but for now I used these.

And building the cli was pretty easy from this library you get a bunch of stuff that just works.

I just wrote my options. 
```cpp 
options.add_options()("command", "Command to run (e.g. build, pack)",
                              cxxopts::value<std::string>())(
            "input", "Input schema file", cxxopts::value<std::string>())(
            "o,out",
            "Output (target language for build, or output binary file for "
            "pack)",
            cxxopts::value<std::string>())("j,json",
                                           "Input JSON file (for pack command)",
                                           cxxopts::value<std::string>())(
            "m,msg", "Root message name to pack (for pack command)",
            cxxopts::value<std::string>())("h,help", "Print usage");

        options.parse_positional({"command", "input"});
        auto result = options.parse(argc, argv);
```

and it works. it was great. and these options were handled in a bunch of if statements(now that I think about it most of this project has just been a loop and a bunch of if statements)

```cpp 
if (command == "build") {
            if (!result.count("input")) {
                std::cerr << "Error: No input file specified." << std::endl;
                return 1;
            }
            if (!result.count("out")) {
                std::cerr << "Error: --out flag is required (e.g., --out c)."
                          << std::endl;
                return 1;
            }

            std::string inputFile = result["input"].as<std::string>();
            std::string targetLang = result["out"].as<std::string>();

            std::ifstream file(inputFile);
            if (!file.is_open()) {
                std::cerr << "Error: Could not open file " << inputFile
                          << std::endl;
                return 1;
            }

            std::stringstream buffer;
            buffer << file.rdbuf();
            std::string schemaText = buffer.str();

            std::vector<Token> tokens = tokenize(schemaText);
            Parser parser(tokens);
            Schema schema = parser.parse();

            SemanticAnalyzer analyzer;
            analyzer.analyze(schema);

            if (targetLang == "c") {
                CGenerator cGen(std::cout);
                schema.accept(cGen);
            } else if (targetLang == "py" || targetLang == "python") {
                PythonGenerator pyGen(std::cout);
                schema.accept(pyGen);
            } else {
                std::cerr << "Code generation for '" << targetLang
                          << "' is not supported yet!" << std::endl;
            }
```

anyhow. lets test it out.

we will write our schema as this:
```
package "com.mmo.game"

enum Faction:
    1. alliance
    2. horde
    3. neutral
end

message Vector3:
    1. x: i32
    2. y: i32
    3. z: i32
end

message InventoryItem:
    1. itemId: i32
    2. quantity: i32
    3. isSoulbound: bool
end

message Character:
    1. id: i64
    2. name: string
    3. level: i32
    4. faction: Faction
    5. position: Vector3
    6. inventory: list(InventoryItem)
    7. attributes: map(string, i32)
end
```


and run build with output as c... and..


```c 
#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdlib.h>

typedef struct Vector3 Vector3;
typedef struct InventoryItem InventoryItem;
typedef struct Character Character;

typedef struct {
    InventoryItem* data;
    size_t length;
    size_t capacity;
} jbin_list_InventoryItem;

typedef struct {
    char** keys;
    int32_t* values;
    size_t length;
    size_t capacity;
} jbin_map_char_ptr_int32;

typedef enum {
    Faction_alliance = 1,
    Faction_horde = 2,
    Faction_neutral = 3,
} Faction;

struct Vector3 {
    int32_t x;
    int32_t y;
    int32_t z;
};

struct InventoryItem {
    int32_t itemId;
    int32_t quantity;
    bool isSoulbound;
};

struct Character {
    int64_t id;
    char* name;
    int32_t level;
    Faction faction;
    Vector3 position;
    jbin_list_InventoryItem inventory;
    jbin_map_char_ptr_int32 attributes;
};

```


LOOK AT THAT!! zero dependency left from the program. we provide all the stuff it needs from our schema!!!

(note: that isn't the full c file that was generated. there were also a lot of pack/unpack functions for individual messages, setters and getters and encode/decode funcs)

we can also encode to binary by passing in a json file.
```json
{
    "id": 123456789,
    "name": "LeroyJenkins",
    "level": 60,
    "faction": "alliance",
    "position": {
        "x": 100,
        "y": 200,
        "z": 300
    },
    "inventory": [
        { "itemId": 999, "quantity": 1, "isSoulbound": true },
        { "itemId": 45, "quantity": 100, "isSoulbound": false }
    ],
    "attributes": {
        "strength": 120,
        "agility": 45
    }
}
```

and the size of this json is ``401 bytes``

lets pack it into binary. and the file size is..

``80 bytes!``

EIGHTY PERCENT REDUCTION

``80.05%``


## Conclusion
So yeah. I started out just wanting to save some
JSON out of spite, and I accidentally built a lexer,
a parser, an AST, a semantic analyzer, a dynamic
binary packer, and a multi-language code generator.
And honestly? Packing binary is fun, actually.


anyhow, checkout the repo.

[jBin](https://github.com/PranavDesai-Git/jbin)
