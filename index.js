"use strict";

var assert = require("assert");
var ipaddr = require("ipaddr.js");

function parseSubnet(subnet) {
    var parts = subnet.split("/");
    var ip = ipaddr.parse(parts[0]);
    var kind = ip.kind();
    var prefixLength = parseInt(parts[1], 10);
    if (isNaN(prefixLength))
        prefixLength = kind === "ipv4" ? 32 : 128;

    if (kind === "ipv6" && ip.isIPv4MappedAddress() && prefixLength >= 96) {
        ip = ip.toIPv4Address();
        kind = "ipv4";
        prefixLength -= 96;
    }

    var bits = "";
    if (kind === "ipv4") {
        if (!(0 <= prefixLength && prefixLength <= 32))
            throw new Error("IPv4 subnet prefix length " + prefixLength + " is not between 0 and 32");

        var p = Math.floor(prefixLength / 8);
        var maskBits = 8 - prefixLength % 8;

        var n = 0;
        for (; n < p && n < ip.octets.length; ++n)
            bits += ("00000000" + ip.octets[n].toString(2)).substr(-8);
        if (n < ip.octets.length) {
            ip.octets[n] &= 0xff >> maskBits << maskBits;
            bits += ("00000000" + ip.octets[n].toString(2)).substr(-8, 8 - maskBits);
        }
        for (++n; n < ip.octets.length; ++n)
            ip.octets[n] = 0;
    } else {
        if (!(0 <= prefixLength && prefixLength <= 128))
            throw new Error("IPv6 subnet prefix length " + prefixLength + " is not between 0 and 128");

        var p = Math.floor(prefixLength / 16);
        var maskBits = 16 - prefixLength % 16;

        var n = 0;
        for (; n < p && n < ip.parts.length; ++n)
            bits += ("0000000000000000" + ip.parts[n].toString(2)).substr(-16);
        if (n < ip.parts.length) {
            ip.parts[n] &= 0xffff >> maskBits << maskBits;
            bits += ("0000000000000000" + ip.parts[n].toString(2)).substr(-16, 16 - maskBits);
        }
        for (++n; n < ip.parts.length; ++n)
            ip.parts[n] = 0;
    }

    assert(bits.length === prefixLength);

    return {kind: kind, ip: ip, prefixLength: prefixLength, bits: bits};
}

function IPRouter(dict) {
    this._v4 = {prefixLength: 0};
    this._v6 = {prefixLength: 0};
    this._size = 0;
    
    this.fromDict(dict);
}
IPRouter.prototype = {
    _findPath: function (src) {
        var bits = src.bits;
        var node = src.kind === "ipv4" ? this._v4 : this._v6;

        var matches = [node];
        var matchedBits = 0;
        while (matchedBits < bits.length) {
            var nextNode = node[bits[matchedBits]];
            if (!nextNode || nextNode.extraBits !== bits.substr(++matchedBits, nextNode.extraBits.length))
                break;

            matchedBits += nextNode.extraBits.length;
            node = nextNode;
            matches.unshift(node);
        }

        return matches;
    },
    find: function (src) {
        src = parseSubnet(src);
        var node = this._findPath(src)[0];
        if (!node.data || node.prefixLength !== src.prefixLength)
            return undefined;

        return node.data.dest;
    },
    findRoutes: function (src) {
        return this._findPath(parseSubnet(src)).filter(function (node) {
            return node.data;
        }).map(function (node) {
            return {src: node.data.ip.toString() + "/" + node.data.prefixLength, dest: node.data.dest};
        });
    },
    route: function (src) {
        var bestMatch = this.findRoutes(src)[0];
        return bestMatch ? bestMatch.dest : undefined;
    },
    insert: function (src, dest) {
        src = parseSubnet(src);
        src.dest = dest;
        var node = this._findPath(src)[0];

        if (node.prefixLength === src.prefixLength) {
            if (node.data) {
                node.data.dest = dest;
                return false;
            } else {
                node.data = src;
                ++this._size;
                return true;
            }
        }

        var leadingBit = src.bits[node.prefixLength];
        var remainingBits = src.bits.slice(node.prefixLength + 1);
        if (!node[leadingBit]) {
            assert(node.prefixLength + 1 + remainingBits.length === src.prefixLength);
            node[leadingBit] = {
                parent: node,
                extraBits: remainingBits,
                prefixLength: src.prefixLength,
                data: src
            };
        } else {
            var c = 0;
            for (; c < node[leadingBit].extraBits.length && c < remainingBits.length && node[leadingBit].extraBits[c] === remainingBits[c]; ++c)
                ;

            var commonBits = remainingBits.slice(0, c);
            remainingBits = remainingBits.slice(c);
            var remainingExtraBits = node[leadingBit].extraBits.slice(c);

            assert(remainingBits.length > 0 || remainingExtraBits.length > 0);
            assert(remainingBits[0] !== remainingExtraBits[0]);

            if (remainingExtraBits.length === 0) {
                assert(node[leadingBit].prefixLength + remainingBits.length === src.prefixLength);
                node[leadingBit][remainingBits[0]] = {
                    parent: node[leadingBit],
                    extraBits: remainingBits.slice(1),
                    prefixLength: src.prefixLength,
                    data: src
                };
            } else {
                var newNode = {
                    parent: node,
                    extraBits: commonBits,
                    prefixLength: node.prefixLength + 1 + commonBits.length
                };
                if (remainingBits.length === 0) {
                    assert(newNode.prefixLength === src.prefixLength);
                    newNode.data = src;
                } else {
                    assert(newNode.prefixLength + remainingBits.length === src.prefixLength);
                    newNode[remainingBits[0]] = {
                        parent: newNode,
                        extraBits: remainingBits.slice(1),
                        prefixLength: src.prefixLength,
                        data: src
                    };
                }

                newNode[remainingExtraBits[0]] = node[leadingBit];
                newNode[remainingExtraBits[0]].parent = newNode;
                newNode[remainingExtraBits[0]].extraBits = remainingExtraBits.slice(1);
                node[leadingBit] = newNode;
            }
        }

        ++this._size;
        return true;
    },
    erase: function (src) {
        src = parseSubnet(src);
        var node = this._findPath(src)[0];
        if (!node.data || node.prefixLength !== src.prefixLength)
            return false;

        if (!node.parent) {
            delete node.data;
            --this._size;
            return true;
        }

        var leadingBit = node.parent[0] === node ? 0 : 1;

        if (node[0] && node[1])
            delete node.data;
        else if (!!node[0] ^ !!node[1])
            if (node[0]) {
                node[0].extraBits = node.extraBits + "0" + node[0].extraBits;
                node.parent[leadingBit] = node[0];
            } else {
                node[1].extraBits = node.extraBits + "1" + node[1].extraBits;
                node.parent[leadingBit] = node[1];
            }
        else
            delete node.parent[leadingBit];

        --this._size;
        return true;
    },
    clear: function () {
        this._v4 = {prefixLength: 0};
        this._v6 = {prefixLength: 0};
        this._size = 0;
    },
    size: function () {
        return this._size;
    },
    empty: function () {
        return this.size() === 0;
    },
    toDict: function () {
        var result = {};
        var stack = [this._v6, this._v4];
        while (stack.length > 0) {
            var node = stack.pop();

            if (node.data) {
                var src = node.data.ip.toString() + "/" + node.data.prefixLength;
                var dest = node.data.dest;

                assert(src in result === false);
                result[src] = dest;
            }

            if (node[1])
                stack.push(node[1]);
            if (node[0])
                stack.push(node[0]);
        }

        return result;
    },
    fromDict: function (dict) {
        var newRoutes = 0;
        for (var src in dict)
            newRoutes += this.insert(src, dict[src]);
        return newRoutes;
    }
};

module.exports = IPRouter;
