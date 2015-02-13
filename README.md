# IP Router
Software IP routing for Node.js implemented with a Patricia/Radix Tree. IPv4, IPv6 and IPv4 mapped as IPv6 are all supported.

Not intended to be used as an actual router, but as a class to assist in managing IP-based bans, etc.

## Usage
* `src` in all functions must be a valid CIDR subnet (e.g., `1.2.3.4/5`, `1:2:3::4:5:6/7`, `::ffff:1.2.3.4/100`). If an invalid subnet is passed, an exception will be raised.

### IPRouter(dict)
* `dict`: (Optional) A dictionary that will be passed directly to `#fromDict()`.

#### #insert(src, dest)
* `src`: Overspecified subnets are automatically adjusted to the prefix length.
* `dest`: Any arbitrary data type that will be returned by the querying functions.
* Returns `true` if it created a new route, or `false` if an existing route was updated.

#### #erase(src)
* `src`: Prefix bits must exactly match an existing route.
* Returns `true` if successful. Otherwise, `false`.

#### #clear()
* Removes all routes.

#### #find(src)
* `src`: Prefix bits must exactly match an existing route.
* Returns the `dest` specified from `#insert()` if found. Otherwise, `undefined`.

#### #findRoutes(src)
* Finds all the routes matching `src`, returning the results in an array of `{src: ..., dest: ...}` pairs ordered by decreasing significance.

#### #route(src)
* `src`: Does not have to exactly match an exiting route.
* Returns the `dest` specified from `#insert()` if found. Otherwise, `undefined`.

#### #size()
* Returns the number of routes stored.

#### #empty()
* Returns `true` if no routes are stored.

#### #toDict()
* Returns all the routes stored as a `src -> dest` dictionary.
* E.g., `{"0.0.0.0/0": "default", "1.1.1.1/32": "specific"}`

#### #fromDict(dict)
* `dict`: Dictionary of `src -> dest`, like the return value of `#toDict()`.
* The router is updated as if each pair was added by `#insert()`. That is, existing routes are updated while new routes are added.
* Returns the number of newly added routes.

## License

This software is licensed under the MIT License.

Copyright 小太, 2015.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
