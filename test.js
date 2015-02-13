"use strict";

var assert = require("assert");
var IPRouter = require("./index.js");

describe("IPRouter", function () {
    describe("#insert and #route", function () {
        it("must return the new destination after inserting an existing source", function () {
            var router = new IPRouter();
            
            assert.strictEqual(router.insert("139.79.194.58", "1"), true);
            assert.strictEqual(router.route("139.79.194.58"), "1");
            assert.strictEqual(router.insert("139.79.194.58", "2"), false);
            assert.strictEqual(router.route("139.79.194.58"), "2");
            
            assert.strictEqual(router.insert("82.8.118.150/30", "3"), true);
            assert.strictEqual(router.route("82.8.118.151"), "3");
            assert.strictEqual(router.insert("82.8.118.150/30", "4"), false);
            assert.strictEqual(router.route("82.8.118.151"), "4");
            assert.strictEqual(router.insert("::ffff:82.8.118.150/126", "5"), false);
            assert.strictEqual(router.route("82.8.118.151"), "5");
            assert.strictEqual(router.insert("82.8.118.149", "6"), true);
            assert.strictEqual(router.route("82.8.118.149"), "6");
            assert.strictEqual(router.route("82.8.118.151"), "5");
        });
        
        function insertTestIPv4(router, isWithDefault) {
            if (isWithDefault)
                assert.strictEqual(router.insert("0.0.0.0/0", "ipv4-default"), true);
            assert.strictEqual(router.insert("7.147.30.153", "ipv4-1"), true);
            assert.strictEqual(router.insert("157.224.106.38/29", "ipv4-2"), true);
            assert.strictEqual(router.insert("142.33.179.177", "ipv4-3"), true);
            assert.strictEqual(router.insert("142.33.179.198/25", "ipv4-4"), true);
            assert.strictEqual(router.insert("142.33.179.177/8", "ipv4-5"), true);
        }
        function testIPv4(router, routerWithDefault) {
            it("must return `undefined` for no route", function () {
                assert.strictEqual(router.route("0.0.0.0"), undefined);
                assert.strictEqual(router.route("96.164.21.6"), undefined);
                assert.strictEqual(router.route("255.255.255.255"), undefined);
            });
            
            it("must default to /32 addresses", function () {
                assert.strictEqual(router.route("7.147.30.152"), undefined);
                assert.strictEqual(router.route("7.147.30.153"), "ipv4-1");
                assert.strictEqual(router.route("7.147.30.154"), undefined);
            });
            
            it("must route non-overlapping subnets", function () {
                assert.strictEqual(router.route("157.224.106.31"), undefined);
                assert.strictEqual(router.route("157.224.106.32"), "ipv4-2");
                assert.strictEqual(router.route("157.224.106.38"), "ipv4-2");
                assert.strictEqual(router.route("157.224.106.39"), "ipv4-2");
                assert.strictEqual(router.route("157.224.106.40"), undefined);
            });
            
            it("must route overlapping subnets", function () {
                assert.strictEqual(router.route("141.255.255.255"), undefined);
                assert.strictEqual(router.route("142.0.0.0"), "ipv4-5");
                assert.strictEqual(router.route("142.33.179.127"), "ipv4-5");
                assert.strictEqual(router.route("142.33.179.128"), "ipv4-4");
                assert.strictEqual(router.route("142.33.179.176"), "ipv4-4");
                assert.strictEqual(router.route("142.33.179.177"), "ipv4-3");
                assert.strictEqual(router.route("142.33.179.178"), "ipv4-4");
                assert.strictEqual(router.route("142.33.179.255"), "ipv4-4");
                assert.strictEqual(router.route("142.33.180.0"), "ipv4-5");
                assert.strictEqual(router.route("142.255.255.255"), "ipv4-5");
                assert.strictEqual(router.route("143.0.0.0"), undefined);
            });
            
            it("must support default routes", function () {
                assert.strictEqual(routerWithDefault.route("0.0.0.0"), "ipv4-default");
                assert.strictEqual(routerWithDefault.route("141.255.255.255"), "ipv4-default");
                assert.strictEqual(routerWithDefault.route("142.0.0.0"), "ipv4-5");
                assert.strictEqual(routerWithDefault.route("142.33.179.127"), "ipv4-5");
                assert.strictEqual(routerWithDefault.route("142.33.179.128"), "ipv4-4");
                assert.strictEqual(routerWithDefault.route("142.33.179.176"), "ipv4-4");
                assert.strictEqual(routerWithDefault.route("142.33.179.177"), "ipv4-3");
                assert.strictEqual(routerWithDefault.route("142.33.179.178"), "ipv4-4");
                assert.strictEqual(routerWithDefault.route("142.33.179.255"), "ipv4-4");
                assert.strictEqual(routerWithDefault.route("142.33.180.0"), "ipv4-5");
                assert.strictEqual(routerWithDefault.route("142.255.255.255"), "ipv4-5");
                assert.strictEqual(routerWithDefault.route("143.0.0.0"), "ipv4-default");
                assert.strictEqual(routerWithDefault.route("255.255.255.255"), "ipv4-default");
            });
        }

        function insertTestIPv6(router, isWithDefault) {
            if (isWithDefault)
                assert.strictEqual(router.insert("::/0", "ipv6-default"), true);
            assert.strictEqual(router.insert("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836", "ipv6-1"), true);
            assert.strictEqual(router.insert("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b/53", "ipv6-2"), true);
            assert.strictEqual(router.insert("bba:4588:9e44:319e:a74e:9467:5d29:713b", "ipv6-3"), true);
            assert.strictEqual(router.insert("bba:4588:9e44:3151::3d1d:184/49", "ipv6-4"), true);
            assert.strictEqual(router.insert("bba:4588:9e44:319e:a74e:9467:5d29:713b/13", "ipv6-5"), true);
        }
        function testIPv6(router, routerWithDefault) {
            it("must return `undefined` for no route", function () {
                assert.strictEqual(router.route("::"), undefined);
                assert.strictEqual(router.route("4354:d1e:15c2:2203:88af:d11f:653:429"), undefined);
                assert.strictEqual(router.route("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), undefined);
            });
            
            it("must default to /128 addresses", function () {
                assert.strictEqual(router.route("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c835"), undefined);
                assert.strictEqual(router.route("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836"), "ipv6-1");
                assert.strictEqual(router.route("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c837"), undefined);
            });
            
            it("must route non-overlapping subnets", function () {
                assert.strictEqual(router.route("b127:84ec:7726:37ff:ffff:ffff:ffff:ffff"), undefined);
                assert.strictEqual(router.route("b127:84ec:7726:3800::"), "ipv6-2");
                assert.strictEqual(router.route("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b"), "ipv6-2");
                assert.strictEqual(router.route("b127:84ec:7726:3fff:ffff:ffff:ffff:ffff"), "ipv6-2");
                assert.strictEqual(router.route("b127:84ec:7726:4000::"), undefined);
            });
            
            it("must route overlapping subnets", function () {
                assert.strictEqual(router.route("bb7:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), undefined);
                assert.strictEqual(router.route("bb8::"), "ipv6-5");
                assert.strictEqual(router.route("bba:4588:9e43:ffff:ffff:ffff:ffff:ffff"), "ipv6-5");
                assert.strictEqual(router.route("bba:4588:9e44::"), "ipv6-4");
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713a"), "ipv6-4");
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713b"), "ipv6-3");
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713c"), "ipv6-4");
                assert.strictEqual(router.route("bba:4588:9e44:7fff:ffff:ffff:ffff:ffff"), "ipv6-4");
                assert.strictEqual(router.route("bba:4588:9e44:8000::"), "ipv6-5");
                assert.strictEqual(router.route("bbf:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), "ipv6-5");
                assert.strictEqual(router.route("bc0::"), undefined);
            });
            
            it("must support default routes", function () {
                assert.strictEqual(routerWithDefault.route("::"), "ipv6-default");
                assert.strictEqual(routerWithDefault.route("bb7:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), "ipv6-default");
                assert.strictEqual(routerWithDefault.route("bb8::"), "ipv6-5");
                assert.strictEqual(routerWithDefault.route("bba:4588:9e43:ffff:ffff:ffff:ffff:ffff"), "ipv6-5");
                assert.strictEqual(routerWithDefault.route("bba:4588:9e44::"), "ipv6-4");
                assert.strictEqual(routerWithDefault.route("bba:4588:9e44:319e:a74e:9467:5d29:713a"), "ipv6-4");
                assert.strictEqual(routerWithDefault.route("bba:4588:9e44:319e:a74e:9467:5d29:713b"), "ipv6-3");
                assert.strictEqual(routerWithDefault.route("bba:4588:9e44:319e:a74e:9467:5d29:713c"), "ipv6-4");
                assert.strictEqual(routerWithDefault.route("bba:4588:9e44:7fff:ffff:ffff:ffff:ffff"), "ipv6-4");
                assert.strictEqual(routerWithDefault.route("bba:4588:9e44:8000::"), "ipv6-5");
                assert.strictEqual(routerWithDefault.route("bbf:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), "ipv6-5");
                assert.strictEqual(routerWithDefault.route("bc0::"), "ipv6-default");
                assert.strictEqual(routerWithDefault.route("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), "ipv6-default");
            });
        }

        function insertTestIPv4asIPv6(router) {
            assert.strictEqual(router.insert("::ffff:181.113.95.42", "ipv4as6-1"), true);
            assert.strictEqual(router.insert("7.29.36.181/29", "ipv4as6-2"), true);
            assert.strictEqual(router.insert("::ffff:9209:df2e", "ipv4as6-3"), true); // 146.9.223.46
            assert.strictEqual(router.insert("146.9.223.1/25", "ipv4as6-4"), true);
            assert.strictEqual(router.insert("::ffff:146.9.223.46/104", "ipv4as6-5"), true);
        }
        function testIPv4asIPv6(router) {
            it("must return `undefined` for no route", function () {
                assert.strictEqual(router.route("0.0.0.0"), undefined);
                assert.strictEqual(router.route("176.220.44.111"), undefined);
                assert.strictEqual(router.route("255.255.255.255"), undefined);
                assert.strictEqual(router.route("::"), undefined);
                assert.strictEqual(router.route("2563:8246:9e83:f22:eb4:175d:f6e5:eb37"), undefined);
                assert.strictEqual(router.route("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), undefined);
            });
            
            it("must default to /32 addresses for IPv4", function () {
                assert.strictEqual(router.route("181.113.95.41"), undefined);
                assert.strictEqual(router.route("181.113.95.42"), "ipv4as6-1");
                assert.strictEqual(router.route("181.113.95.43"), undefined);
            });
            it("must default to /128 addresses for IPv6", function () {
                assert.strictEqual(router.route("::ffff:b571:5f29"), undefined);
                assert.strictEqual(router.route("::ffff:b571:5f2a"), "ipv4as6-1");
                assert.strictEqual(router.route("::ffff:181.113.95.43"), undefined);
            });
            
            it("must route non-overlapping subnets", function () {
                assert.strictEqual(router.route("::ffff:7.29.36.175"), undefined);
                assert.strictEqual(router.route("::ffff:71d:24b0"), "ipv4as6-2");
                assert.strictEqual(router.route("::ffff:71d:24b5"), "ipv4as6-2");
                assert.strictEqual(router.route("::ffff:7.29.36.183"), "ipv4as6-2");
                assert.strictEqual(router.route("::ffff:71d:24b8"), undefined);
            });
            
            it("must route overlapping subnets", function () {
                assert.strictEqual(router.route("145.255.255.255"), undefined);
                assert.strictEqual(router.route("::ffff:146.0.0.0"), "ipv4as6-5");
                assert.strictEqual(router.route("::ffff:9209:deff"), "ipv4as6-5");
                assert.strictEqual(router.route("146.9.223.0"), "ipv4as6-4");
                assert.strictEqual(router.route("146.9.223.45"), "ipv4as6-4");
                assert.strictEqual(router.route("146.9.223.46"), "ipv4as6-3");
                assert.strictEqual(router.route("::ffff:9209:df2f"), "ipv4as6-4");
                assert.strictEqual(router.route("::ffff:146.9.223.127"), "ipv4as6-4");
                assert.strictEqual(router.route("146.9.223.128"), "ipv4as6-5");
                assert.strictEqual(router.route("146.255.255.255"), "ipv4as6-5");
                assert.strictEqual(router.route("::ffff:9300:0"), undefined);
            });
        }

        describe("IPv4", function () {
            var router = new IPRouter();
            var routerWithDefault = new IPRouter();
            insertTestIPv4(router);
            insertTestIPv4(routerWithDefault, true);
            testIPv4(router, routerWithDefault);
        });

        describe("IPv6", function () {
            var router = new IPRouter();
            var routerWithDefault = new IPRouter();
            insertTestIPv6(router);
            insertTestIPv6(routerWithDefault, true);
            testIPv6(router, routerWithDefault);
        });

        describe("IPv4 as IPv6", function () {
            var router = new IPRouter();
            insertTestIPv4asIPv6(router);
            testIPv4asIPv6(router);
        });

        describe("Mixed", function () {
            var router = new IPRouter();
            var routerWithDefault = new IPRouter();
            insertTestIPv4(router);
            insertTestIPv6(router);
            insertTestIPv4asIPv6(router);
            insertTestIPv4(routerWithDefault, true);
            insertTestIPv6(routerWithDefault, true);
            
            describe("IPv4", function () {
                testIPv4(router, routerWithDefault);
            });
            describe("IPv6", function () {
                testIPv6(router, routerWithDefault);
            });
            describe("IPv4 as IPv6", function () {
                testIPv4asIPv6(router);
            });
        });
    });
    
    describe("#erase", function () {
        function insertTestIPv4(router) {
            assert.strictEqual(router.insert("7.147.30.153", "ipv4-1"), true);
            assert.strictEqual(router.insert("157.224.106.38/29", "ipv4-2"), true);
            assert.strictEqual(router.insert("142.33.179.177", "ipv4-3"), true);
            assert.strictEqual(router.insert("142.33.179.198/25", "ipv4-4"), true);
            assert.strictEqual(router.insert("142.33.179.177/8", "ipv4-5"), true);
        }
        function testIPv4(router) {
            it("must only erase exact matches", function () {
                assert.strictEqual(router.erase("7.147.30.153/31"), false);
                assert.strictEqual(router.route("7.147.30.153"), "ipv4-1");
                assert.strictEqual(router.erase("7.147.30.153"), true);
                assert.strictEqual(router.route("7.147.30.153"), undefined);
                
                assert.strictEqual(router.erase("157.224.106.38/28"), false);
                assert.strictEqual(router.erase("157.224.106.38/30"), false);
                assert.strictEqual(router.route("157.224.106.32"), "ipv4-2");
                assert.strictEqual(router.route("157.224.106.38"), "ipv4-2");
                assert.strictEqual(router.route("157.224.106.39"), "ipv4-2");
                assert.strictEqual(router.erase("157.224.106.32/29"), true);
                assert.strictEqual(router.route("157.224.106.32"), undefined);
                assert.strictEqual(router.route("157.224.106.38"), undefined);
                assert.strictEqual(router.route("157.224.106.39"), undefined);
            });
            
            it("must route as if entry did not exist", function () {
                assert.strictEqual(router.erase("142.33.179.198/25"), true);
                assert.strictEqual(router.route("142.33.179.128"), "ipv4-5");
                assert.strictEqual(router.route("142.33.179.176"), "ipv4-5");
                assert.strictEqual(router.route("142.33.179.177"), "ipv4-3");
                assert.strictEqual(router.route("142.33.179.178"), "ipv4-5");
                assert.strictEqual(router.route("142.33.179.255"), "ipv4-5");
                
                assert.strictEqual(router.erase("142.104.240.56/8"), true);
                assert.strictEqual(router.route("142.0.0.0"), undefined);
                assert.strictEqual(router.route("142.33.179.127"), undefined);
                assert.strictEqual(router.route("142.33.179.128"), undefined);
                assert.strictEqual(router.route("142.33.179.176"), undefined);
                assert.strictEqual(router.route("142.33.179.177"), "ipv4-3");
                assert.strictEqual(router.route("142.33.179.178"), undefined);
                assert.strictEqual(router.route("142.33.179.255"), undefined);
                assert.strictEqual(router.route("142.33.180.0"), undefined);
                assert.strictEqual(router.route("142.255.255.255"), undefined);
            });
        }

        function insertTestIPv6(router) {
            assert.strictEqual(router.insert("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836", "ipv6-1"), true);
            assert.strictEqual(router.insert("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b/53", "ipv6-2"), true);
            assert.strictEqual(router.insert("bba:4588:9e44:319e:a74e:9467:5d29:713b", "ipv6-3"), true);
            assert.strictEqual(router.insert("bba:4588:9e44:3151::3d1d:184/49", "ipv6-4"), true);
            assert.strictEqual(router.insert("bba:4588:9e44:319e:a74e:9467:5d29:713b/13", "ipv6-5"), true);
        }
        function testIPv6(router) {
            it("must only erase exact matches", function () {
                assert.strictEqual(router.erase("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836/64"), false);
                assert.strictEqual(router.route("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836"), "ipv6-1");
                assert.strictEqual(router.erase("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836"), true);
                assert.strictEqual(router.route("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836"), undefined);
                
                assert.strictEqual(router.erase("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b/52"), false);
                assert.strictEqual(router.erase("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b/54"), false);
                assert.strictEqual(router.route("b127:84ec:7726:3800::"), "ipv6-2");
                assert.strictEqual(router.route("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b"), "ipv6-2");
                assert.strictEqual(router.route("b127:84ec:7726:3fff:ffff:ffff:ffff:ffff"), "ipv6-2");
                assert.strictEqual(router.erase("b127:84ec:7726:3a00::/53"), true);
                assert.strictEqual(router.route("b127:84ec:7726:3800::"), undefined);
                assert.strictEqual(router.route("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b"), undefined);
                assert.strictEqual(router.route("b127:84ec:7726:3fff:ffff:ffff:ffff:ffff"), undefined);
            });
            
            it("must route as if entry did not exist", function () {
                assert.strictEqual(router.erase("bba:4588:9e44:3151::3d1d:184/49"), true);
                assert.strictEqual(router.route("bba:4588:9e44::"), "ipv6-5");
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713a"), "ipv6-5");
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713b"), "ipv6-3");
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713c"), "ipv6-5");
                assert.strictEqual(router.route("bba:4588:9e44:7fff:ffff:ffff:ffff:ffff"), "ipv6-5");
                
                assert.strictEqual(router.erase("bb8::/13"), true);
                assert.strictEqual(router.route("bb8::"), undefined);
                assert.strictEqual(router.route("bba:4588:9e43:ffff:ffff:ffff:ffff:ffff"), undefined);
                assert.strictEqual(router.route("bba:4588:9e44::"), undefined);
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713a"), undefined);
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713b"), "ipv6-3");
                assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713c"), undefined);
                assert.strictEqual(router.route("bba:4588:9e44:7fff:ffff:ffff:ffff:ffff"), undefined);
                assert.strictEqual(router.route("bba:4588:9e44:8000::"), undefined);
                assert.strictEqual(router.route("bbf:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), undefined);
            });
        }

        function insertTestIPv4asIPv6(router) {
            assert.strictEqual(router.insert("::ffff:181.113.95.42", "ipv4as6-1"), true);
            assert.strictEqual(router.insert("7.29.36.181/29", "ipv4as6-2"), true);
            assert.strictEqual(router.insert("::ffff:9209:df2e", "ipv4as6-3"), true); // 146.9.223.46
            assert.strictEqual(router.insert("146.9.223.1/25", "ipv4as6-4"), true);
            assert.strictEqual(router.insert("::ffff:146.9.223.46/104", "ipv4as6-5"), true);
        }
        function testIPv4asIPv6(router) {
            it("must only erase exact matches", function () {
                assert.strictEqual(router.erase("181.113.95.42/24"), false);
                assert.strictEqual(router.route("::ffff:181.113.95.42"), "ipv4as6-1");
                assert.strictEqual(router.erase("::ffff:b571:5f2a"), true);
                assert.strictEqual(router.route("::ffff:181.113.95.42"), undefined);
                
                assert.strictEqual(router.erase("7.29.36.181/28"), false);
                assert.strictEqual(router.erase("::ffff:7.29.36.181/126"), false);
                assert.strictEqual(router.route("7.29.36.176"), "ipv4as6-2");
                assert.strictEqual(router.route("7.29.36.181"), "ipv4as6-2");
                assert.strictEqual(router.route("7.29.36.183"), "ipv4as6-2");
                assert.strictEqual(router.erase("::ffff:71d:24b0/125"), true);
                assert.strictEqual(router.route("7.29.36.176"), undefined);
                assert.strictEqual(router.route("7.29.36.181"), undefined);
                assert.strictEqual(router.route("7.29.36.183"), undefined);
            });
            
            it("must route as if entry did not exist", function () {
                assert.strictEqual(router.erase("::ffff:146.9.223.1/121"), true);
                assert.strictEqual(router.route("146.9.223.0"), "ipv4as6-5");
                assert.strictEqual(router.route("146.9.223.45"), "ipv4as6-5");
                assert.strictEqual(router.route("146.9.223.46"), "ipv4as6-3");
                assert.strictEqual(router.route("146.9.223.47"), "ipv4as6-5");
                assert.strictEqual(router.route("146.9.223.127"), "ipv4as6-5");
                
                assert.strictEqual(router.erase("146.0.0.0/8"), true);
                assert.strictEqual(router.route("146.0.0.0"), undefined);
                assert.strictEqual(router.route("146.9.222.255"), undefined);
                assert.strictEqual(router.route("146.9.223.0"), undefined);
                assert.strictEqual(router.route("146.9.223.45"), undefined);
                assert.strictEqual(router.route("146.9.223.46"), "ipv4as6-3");
                assert.strictEqual(router.route("146.9.223.47"), undefined);
                assert.strictEqual(router.route("146.9.223.127"), undefined);
                assert.strictEqual(router.route("146.9.223.128"), undefined);
                assert.strictEqual(router.route("146.255.255.255"), undefined);
            });
        }

        describe("IPv4", function () {
            var router = new IPRouter();
            
            beforeEach(function () {
                insertTestIPv4(router);
            });
            afterEach(function () {
                router.clear();
            });
            
            testIPv4(router);
        });

        describe("IPv6", function () {
            var router = new IPRouter();
            
            beforeEach(function () {
                insertTestIPv6(router);
            });
            afterEach(function () {
                router.clear();
            });
            
            testIPv6(router);
        });

        describe("IPv4 as IPv6", function () {
            var router = new IPRouter();
            
            beforeEach(function () {
                insertTestIPv4asIPv6(router);
            });
            afterEach(function () {
                router.clear();
            });
            
            testIPv4asIPv6(router);
        });

        describe("Mixed", function () {
            var router = new IPRouter();
            
            beforeEach(function () {
                insertTestIPv4(router);
                insertTestIPv6(router);
                insertTestIPv4asIPv6(router);
            });
            afterEach(function () {
                router.clear();
            });
            
            describe("IPv4", function () {
                testIPv4(router);
            });
            describe("IPv6", function () {
                testIPv6(router);
            });
            describe("IPv4 as IPv6", function () {
                testIPv4asIPv6(router);
            });
        });
    });

    describe("#size and #empty", function () {
        var router = new IPRouter();
        
        it("must be empty at construction", function () {
            assert.strictEqual(router.size(), 0);
            assert.strictEqual(router.empty(), true);
        });
        
        it("must have the correct size", function () {
            assert.strictEqual(router.insert("122.133.46.230", "1"), true);
            assert.strictEqual(router.size(), 1);
            assert.strictEqual(router.empty(), false);
            assert.strictEqual(router.insert("122.133.46.230", "2"), false);
            assert.strictEqual(router.size(), 1);
            assert.strictEqual(router.insert("122.133.46.231", "3"), true);
            assert.strictEqual(router.size(), 2);
            assert.strictEqual(router.insert("122.133.46.231/24", "4"), true);
            assert.strictEqual(router.size(), 3);
            assert.strictEqual(router.insert("122.133.46.142/24", "5"), false);
            assert.strictEqual(router.size(), 3);
            assert.strictEqual(router.insert("122.133.46.230", "6"), false);
            assert.strictEqual(router.size(), 3);
            
            assert.strictEqual(router.erase("122.133.46.230"), true);
            assert.strictEqual(router.size(), 2);
            assert.strictEqual(router.insert("122.133.46.230", "7"), true);
            assert.strictEqual(router.size(), 3);
            assert.strictEqual(router.erase("122.133.46.142/24"), true);
            assert.strictEqual(router.size(), 2);
            assert.strictEqual(router.insert("122.133.46.142/24", "8"), true);
            assert.strictEqual(router.size(), 3);
            
            assert.strictEqual(router.insert("::ffff:122.133.46.231", "9"), false);
            assert.strictEqual(router.size(), 3);
            assert.strictEqual(router.insert("::ffff:122.133.46.93/120", "10"), false);
            assert.strictEqual(router.size(), 3);
            assert.strictEqual(router.insert("::ffff:122.133.46.93/121", "11"), true);
            assert.strictEqual(router.size(), 4);
            assert.strictEqual(router.insert("122.133.46.31/25", "12"), false);
            assert.strictEqual(router.size(), 4);
            
            assert.strictEqual(router.erase("::ffff:122.133.46.93/120"), true);
            assert.strictEqual(router.size(), 3);
            assert.strictEqual(router.insert("::ffff:122.133.46.93/120", "13"), true);
            assert.strictEqual(router.size(), 4);
            assert.strictEqual(router.erase("122.133.46.31/25"), true);
            assert.strictEqual(router.size(), 3);
            assert.strictEqual(router.insert("122.133.46.31/25", "14"), true);
            assert.strictEqual(router.size(), 4);
            
            assert.strictEqual(router.insert("464d:3595:ddee:a3d4:204d:efb9:20a:1c2f", "15"), true);
            assert.strictEqual(router.size(), 5);
            assert.strictEqual(router.insert("464d:3595:ddee:a3d4:204d:efb9:20a:1c2f", "16"), false);
            assert.strictEqual(router.size(), 5);
            assert.strictEqual(router.insert("464d:3595:ddee:a3d4:204d:efb9:20a:1c30", "17"), true);
            assert.strictEqual(router.size(), 6);
            assert.strictEqual(router.insert("464d:3595:ddee:a3d4:204d:efb9:20a:1c30/48", "18"), true);
            assert.strictEqual(router.size(), 7);
            assert.strictEqual(router.insert("464d:3595:ddee:6d2d:f8f7:1e29:909f:dee5/48", "19"), false);
            assert.strictEqual(router.size(), 7);
            assert.strictEqual(router.insert("464d:3595:ddee:a3d4:204d:efb9:20a:1c30", "20"), false);
            assert.strictEqual(router.size(), 7);
            assert.strictEqual(router.insert("464d:3595:ddee:a3d4:204d:efb9:20a:1c30/64", "21"), true);
            assert.strictEqual(router.size(), 8);
            
            assert.strictEqual(router.erase("464d:3595:ddee:a3d4:204d:efb9:20a:1c30"), true);
            assert.strictEqual(router.size(), 7);
            assert.strictEqual(router.insert("464d:3595:ddee:a3d4:204d:efb9:20a:1c30", "22"), true);
            assert.strictEqual(router.size(), 8);
            assert.strictEqual(router.erase("464d:3595:ddee:6d2d:f8f7:1e29:909f:dee5/48"), true);
            assert.strictEqual(router.size(), 7);
            assert.strictEqual(router.insert("464d:3595:ddee:6d2d:f8f7:1e29:909f:dee5/48", "23"), true);
            assert.strictEqual(router.size(), 8);
        });
        
        it("must be empty after clearing", function () {
            router.clear();
            assert.strictEqual(router.size(), 0);
            assert.strictEqual(router.empty(), true);
        });
    });
    
    describe("#fromDict and #toDict", function () {
        var router = new IPRouter({
            "0.0.0.0/0": "ipv4-default",
            "7.147.30.153": "ipv4-1",
            "157.224.106.38/29": "ipv4-2",
            "142.33.179.177": "ipv4-3",
            "142.33.179.198/25": "ipv4-4",
            "142.33.179.177/8": "ipv4-5",
            
            "::/0": "ipv6-default",
            "3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836": "ipv6-1",
            "b127:84ec:7726:3b3c:16d:6ac0:4f78:486b/53": "ipv6-2",
            "bba:4588:9e44:319e:a74e:9467:5d29:713b": "ipv6-3",
            "bba:4588:9e44:3151::3d1d:184/49": "ipv6-4",
            "bba:4588:9e44:319e:a74e:9467:5d29:713b/13": "ipv6-5",
            
            "::ffff:181.113.95.42": "ipv4as6-1",
            "7.29.36.181/29": "ipv4as6-2",
            "::ffff:9209:df2e": "ipv4as6-3",
            "146.9.223.1/25": "ipv4as6-4",
            "::ffff:146.9.223.46/104": "ipv4as6-5"
        });
        
        it("must import properly", function () {
            assert.strictEqual(router.route("7.147.30.153"), "ipv4-1");
            assert.strictEqual(router.route("157.224.106.32"), "ipv4-2");
            assert.strictEqual(router.route("157.224.106.38"), "ipv4-2");
            assert.strictEqual(router.route("157.224.106.39"), "ipv4-2");
            assert.strictEqual(router.route("0.0.0.0"), "ipv4-default");
            assert.strictEqual(router.route("141.255.255.255"), "ipv4-default");
            assert.strictEqual(router.route("142.0.0.0"), "ipv4-5");
            assert.strictEqual(router.route("142.33.179.127"), "ipv4-5");
            assert.strictEqual(router.route("142.33.179.128"), "ipv4-4");
            assert.strictEqual(router.route("142.33.179.176"), "ipv4-4");
            assert.strictEqual(router.route("142.33.179.177"), "ipv4-3");
            assert.strictEqual(router.route("142.33.179.178"), "ipv4-4");
            assert.strictEqual(router.route("142.33.179.255"), "ipv4-4");
            assert.strictEqual(router.route("142.33.180.0"), "ipv4-5");
            assert.strictEqual(router.route("142.255.255.255"), "ipv4-5");
            assert.strictEqual(router.route("143.0.0.0"), "ipv4-default");
            assert.strictEqual(router.route("255.255.255.255"), "ipv4-default");
            
            assert.strictEqual(router.route("3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836"), "ipv6-1");
            assert.strictEqual(router.route("b127:84ec:7726:3800::"), "ipv6-2");
            assert.strictEqual(router.route("b127:84ec:7726:3b3c:16d:6ac0:4f78:486b"), "ipv6-2");
            assert.strictEqual(router.route("b127:84ec:7726:3fff:ffff:ffff:ffff:ffff"), "ipv6-2");
            assert.strictEqual(router.route("::"), "ipv6-default");
            assert.strictEqual(router.route("bb7:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), "ipv6-default");
            assert.strictEqual(router.route("bb8::"), "ipv6-5");
            assert.strictEqual(router.route("bba:4588:9e43:ffff:ffff:ffff:ffff:ffff"), "ipv6-5");
            assert.strictEqual(router.route("bba:4588:9e44::"), "ipv6-4");
            assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713a"), "ipv6-4");
            assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713b"), "ipv6-3");
            assert.strictEqual(router.route("bba:4588:9e44:319e:a74e:9467:5d29:713c"), "ipv6-4");
            assert.strictEqual(router.route("bba:4588:9e44:7fff:ffff:ffff:ffff:ffff"), "ipv6-4");
            assert.strictEqual(router.route("bba:4588:9e44:8000::"), "ipv6-5");
            assert.strictEqual(router.route("bbf:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), "ipv6-5");
            assert.strictEqual(router.route("bc0::"), "ipv6-default");
            assert.strictEqual(router.route("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), "ipv6-default");
            
            assert.strictEqual(router.route("181.113.95.42"), "ipv4as6-1");
            assert.strictEqual(router.route("::ffff:b571:5f2a"), "ipv4as6-1");
            assert.strictEqual(router.route("::ffff:71d:24b0"), "ipv4as6-2");
            assert.strictEqual(router.route("::ffff:71d:24b5"), "ipv4as6-2");
            assert.strictEqual(router.route("::ffff:7.29.36.183"), "ipv4as6-2");
            assert.strictEqual(router.route("::ffff:0:0"), "ipv4-default");
            assert.strictEqual(router.route("145.255.255.255"), "ipv4-default");
            assert.strictEqual(router.route("::ffff:146.0.0.0"), "ipv4as6-5");
            assert.strictEqual(router.route("::ffff:9209:deff"), "ipv4as6-5");
            assert.strictEqual(router.route("146.9.223.0"), "ipv4as6-4");
            assert.strictEqual(router.route("146.9.223.45"), "ipv4as6-4");
            assert.strictEqual(router.route("146.9.223.46"), "ipv4as6-3");
            assert.strictEqual(router.route("::ffff:9209:df2f"), "ipv4as6-4");
            assert.strictEqual(router.route("::ffff:146.9.223.127"), "ipv4as6-4");
            assert.strictEqual(router.route("146.9.223.128"), "ipv4as6-5");
            assert.strictEqual(router.route("146.255.255.255"), "ipv4as6-5");
            assert.strictEqual(router.route("::ffff:9300:0"), "ipv4-default");
            assert.strictEqual(router.route("::ffff:255.255.255.255"), "ipv4-default");
        });
        
        it("must export properly", function () {
            assert.deepEqual(router.toDict(), {
                "0.0.0.0/0": "ipv4-default",
                "7.147.30.153/32": "ipv4-1",
                "157.224.106.32/29": "ipv4-2",
                "142.33.179.177/32": "ipv4-3",
                "142.33.179.128/25": "ipv4-4",
                "142.0.0.0/8": "ipv4-5",

                "::/0": "ipv6-default",
                "3d02:188a:d8d4:70b5:8ad0:bed:54ab:c836/128": "ipv6-1",
                "b127:84ec:7726:3800::/53": "ipv6-2",
                "bba:4588:9e44:319e:a74e:9467:5d29:713b/128": "ipv6-3",
                "bba:4588:9e44::/49": "ipv6-4",
                "bb8::/13": "ipv6-5",

                "181.113.95.42/32": "ipv4as6-1",
                "7.29.36.176/29": "ipv4as6-2",
                "146.9.223.46/32": "ipv4as6-3",
                "146.9.223.0/25": "ipv4as6-4",
                "146.0.0.0/8": "ipv4as6-5"
            });
        });
    });
    
    describe("#findRoutes", function () {
        it("must return an empty array when there are no matching routes", function () {
            assert.deepEqual(new IPRouter().findRoutes("0.159.248.158"), []);
            assert.deepEqual(new IPRouter().findRoutes("abec:7c71:cd28:728f:e6b2:f1dc:763e:3ea3"), []);
        });
        
        it("must return an array of routes ordered by decreasing significance", function () {
            var router = new IPRouter({
                "254.112.0.0/14": 1,
                "254.115.235.108/32": 2,
                "254.114.128.132/31": 3,
                "254.114.128.132/32": 4,
                "240.0.0.0/6": 5,
                "241.202.255.222/32": 6,
                "240.192.0.0/10": 7,
                "240.215.157.92/30": 8,
                "240.215.157.94/32": 9,
                "240.218.0.0/15": 10,
                "240.218.185.77/32": 11,
                "44.23.155.0/28": 12,
                "44.23.155.9/32": 13,
                
                "10c2:7516:93b8:c800::/54": 14,
                "10c2:7516:93b8:ca89:9800::/69": 15,
                "10c2:7516:93b8:ca89:9db5:962e:9d96:b3f6/128": 16,
                "10c2:7516:93b8:cb82:2e8d:e3d5:355a:ec89/128": 17,
                "db20::/13": 18,
                "db22:20e1:cd4c:93c7:1660::/75": 19,
                "db22:20e1:cd4c:93c7:1669:97e0:b000::/101": 20,
                "db22:20e1:cd4c:93c7:1669:97e0:b556:fd03/128": 21,
                "db22:20e1:cd4c:93c7:1669:97e0:b499:8555/128": 22,
                "db22:20e1:cd4c:93c7:1669:97e0:b5e4:b0a3/128": 23,
                "132f:1279:3e52:8378::/62": 24,
                "132f:1279:3e52:8379:85c7:b393:82ae:4af9/128": 25
            });
            
            assert.deepEqual(router.findRoutes("254.112.0.0"), [{"src": "254.112.0.0/14", "dest": 1}]);
            assert.deepEqual(router.findRoutes("254.115.235.108"), [{"src": "254.115.235.108/32", "dest": 2}, {"src": "254.112.0.0/14", "dest": 1}]);
            assert.deepEqual(router.findRoutes("254.114.128.132/31"), [{"src": "254.114.128.132/31", "dest": 3}, {"src": "254.112.0.0/14", "dest": 1}]);
            assert.deepEqual(router.findRoutes("254.114.128.132"), [{"src": "254.114.128.132/32", "dest": 4}, {"src": "254.114.128.132/31", "dest": 3}, {"src": "254.112.0.0/14", "dest": 1}]);
            assert.deepEqual(router.findRoutes("240.0.0.0"), [{"src": "240.0.0.0/6", "dest": 5}]);
            assert.deepEqual(router.findRoutes("241.202.255.222"), [{"src": "241.202.255.222/32", "dest": 6}, {"src": "240.0.0.0/6", "dest": 5}]);
            assert.deepEqual(router.findRoutes("240.192.0.0"), [{"src": "240.192.0.0/10", "dest": 7}, {"src": "240.0.0.0/6", "dest": 5}]);
            assert.deepEqual(router.findRoutes("240.215.157.92"), [{"src": "240.215.157.92/30", "dest": 8}, {"src": "240.192.0.0/10", "dest": 7}, {"src": "240.0.0.0/6", "dest": 5}]);
            assert.deepEqual(router.findRoutes("240.215.157.94"), [{"src": "240.215.157.94/32", "dest": 9}, {"src": "240.215.157.92/30", "dest": 8}, {"src": "240.192.0.0/10", "dest": 7}, {"src": "240.0.0.0/6", "dest": 5}]);
            assert.deepEqual(router.findRoutes("240.218.0.0"), [{"src": "240.218.0.0/15", "dest": 10}, {"src": "240.192.0.0/10", "dest": 7}, {"src": "240.0.0.0/6", "dest": 5}]);
            assert.deepEqual(router.findRoutes("240.218.185.77"), [{"src": "240.218.185.77/32", "dest": 11}, {"src": "240.218.0.0/15", "dest": 10}, {"src": "240.192.0.0/10", "dest": 7}, {"src": "240.0.0.0/6", "dest": 5}]);
            assert.deepEqual(router.findRoutes("44.23.155.0"), [{"src": "44.23.155.0/28", "dest": 12}]);
            assert.deepEqual(router.findRoutes("44.23.155.9"), [{"src": "44.23.155.9/32", "dest": 13}, {"src": "44.23.155.0/28", "dest": 12}]);
            
            assert.deepEqual(router.findRoutes("10c2:7516:93b8:c800::"), [{"src": "10c2:7516:93b8:c800::/54", "dest": 14}]);
            assert.deepEqual(router.findRoutes("10c2:7516:93b8:ca89:9800::"), [{"src": "10c2:7516:93b8:ca89:9800::/69", "dest": 15}, {"src": "10c2:7516:93b8:c800::/54", "dest": 14}]);
            assert.deepEqual(router.findRoutes("10c2:7516:93b8:ca89:9db5:962e:9d96:b3f6"), [{"src": "10c2:7516:93b8:ca89:9db5:962e:9d96:b3f6/128", "dest": 16}, {"src": "10c2:7516:93b8:ca89:9800::/69", "dest": 15}, {"src": "10c2:7516:93b8:c800::/54", "dest": 14}]);
            assert.deepEqual(router.findRoutes("10c2:7516:93b8:cb82:2e8d:e3d5:355a:ec89"), [{"src": "10c2:7516:93b8:cb82:2e8d:e3d5:355a:ec89/128", "dest": 17}, {"src": "10c2:7516:93b8:c800::/54", "dest": 14}]);
            assert.deepEqual(router.findRoutes("db20::"), [{"src": "db20::/13", "dest": 18}]);
            assert.deepEqual(router.findRoutes("db22:20e1:cd4c:93c7:1660::"), [{"src": "db22:20e1:cd4c:93c7:1660::/75", "dest": 19}, {"src": "db20::/13", "dest": 18}]);
            assert.deepEqual(router.findRoutes("db22:20e1:cd4c:93c7:1669:97e0:b000::"), [{"src": "db22:20e1:cd4c:93c7:1669:97e0:b000::/101", "dest": 20}, {"src": "db22:20e1:cd4c:93c7:1660::/75", "dest": 19}, {"src": "db20::/13", "dest": 18}]);
            assert.deepEqual(router.findRoutes("db22:20e1:cd4c:93c7:1669:97e0:b556:fd03"), [{"src": "db22:20e1:cd4c:93c7:1669:97e0:b556:fd03/128", "dest": 21}, {"src": "db22:20e1:cd4c:93c7:1669:97e0:b000::/101", "dest": 20}, {"src": "db22:20e1:cd4c:93c7:1660::/75", "dest": 19}, {"src": "db20::/13", "dest": 18}]);
            assert.deepEqual(router.findRoutes("db22:20e1:cd4c:93c7:1669:97e0:b499:8555"), [{"src": "db22:20e1:cd4c:93c7:1669:97e0:b499:8555/128", "dest": 22}, {"src": "db22:20e1:cd4c:93c7:1669:97e0:b000::/101", "dest": 20}, {"src": "db22:20e1:cd4c:93c7:1660::/75", "dest": 19}, {"src": "db20::/13", "dest": 18}]);
            assert.deepEqual(router.findRoutes("db22:20e1:cd4c:93c7:1669:97e0:b5e4:b0a3"), [{"src": "db22:20e1:cd4c:93c7:1669:97e0:b5e4:b0a3/128", "dest": 23}, {"src": "db22:20e1:cd4c:93c7:1669:97e0:b000::/101", "dest": 20}, {"src": "db22:20e1:cd4c:93c7:1660::/75", "dest": 19}, {"src": "db20::/13", "dest": 18}]);
            assert.deepEqual(router.findRoutes("132f:1279:3e52:8378::"), [{"src": "132f:1279:3e52:8378::/62", "dest": 24}]);
            assert.deepEqual(router.findRoutes("132f:1279:3e52:8379:85c7:b393:82ae:4af9"), [{"src": "132f:1279:3e52:8379:85c7:b393:82ae:4af9/128", "dest": 25}, {"src": "132f:1279:3e52:8378::/62", "dest": 24}]);
        });
    });
});
