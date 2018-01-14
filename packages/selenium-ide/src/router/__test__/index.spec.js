// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import Router from "../index";

describe("string router", () => {
  it("should support get verb", () => {
    const router = new Router();
    router.get("/", (req, res) => {
      res(true);
    });
    return expect(router.run({
      verb: "get",
      uri: "/"
    })).resolves.toBeTruthy();
  });
  it("should support put verb", () => {
    const router = new Router();
    router.put("/", (req, res) => {
      res(true);
    });
    return expect(router.run({
      verb: "put",
      uri: "/"
    })).resolves.toBeTruthy();
  });
  it("should support patch verb", () => {
    const router = new Router();
    router.patch("/", (req, res) => {
      res(true);
    });
    return expect(router.run({
      verb: "patch",
      uri: "/"
    })).resolves.toBeTruthy();
  });
  it("should support post verb", () => {
    const router = new Router();
    router.post("/", (req, res) => {
      res(true);
    });
    return expect(router.run({
      verb: "post",
      uri: "/"
    })).resolves.toBeTruthy();
  });
  it("should support delete verb", () => {
    const router = new Router();
    router.delete("/", (req, res) => {
      res(true);
    });
    return expect(router.run({
      verb: "delete",
      uri: "/"
    })).resolves.toBeTruthy();
  });
  it("should support any verb", () => {
    const router = new Router();
    router.all("/", (req, res) => {
      res(true);
    });
    return expect(router.run({
      uri: "/"
    })).resolves.toBeTruthy();
  });
  it("should handle verbs case insensitive", () => {
    const router = new Router();
    router.get("/", (req, res) => {
      res(true);
    });
    return Promise.all([expect(router.run({
      verb: "GET",
      uri: "/"
    })).resolves.toBeTruthy(),
    expect(router.run({
      verb: "get",
      uri: "/"
    })).resolves.toBeTruthy(),
    expect(router.run({
      verb: "GeT",
      uri: "/"
    })).resolves.toBeTruthy()
    ]);
  });
});
