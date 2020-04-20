import * as datalog from './datalog'
// @ts-ignore
import * as DataFrog from 'datafrog-js'

type PersonID = number

// describe('Free Variable', () => {
//     test('Constrains', () => {
//         // { id: PersonID, name: String}
//         const person = datalog.Relation<{ id: PersonID, name: string }>()
//         const v = new datalog.FreeVariable()
//         v.constrain([1, 2, 3, 4])
//         expect(v.availableValues).toStrictEqual([1, 2, 3, 4]);
//         v.constrain([2, 3])
//         expect(v.availableValues).toStrictEqual([2, 3]);
//     });
// })

describe.skip("Playground", () => {
    test("Generators", () => {
        console.log('here')
        function count(n: number, cb: (i: number) => void) {
            for (let i = 0; i < n; i++) {
                cb(i)
            }
        }

        function countGen(n: number): Iterable<number> {
            const out: any = [];
            count(n, i => out.push(i))
            return out[Symbol.iterator]()
        }

        console.log(count(10, (n) => console.log(n)))
        console.log([...countGen(10)])
    })
})

describe('Relation', () => {
    // test('Returns a function', () => {
    // { id: PersonID, name: String}
    // const person = datalog.Relation<{ id: PersonID, name: string }>()

    // expect(typeof person).toBe("function");
    // });
    const newPerson = () => new datalog.RelationIndex<"id", PersonID, { name: string }>([], ["id", "name"])

    test('Inserts something in the correct place', () => {
        // { id: PersonID, name: String}
        const person = newPerson()

        expect(person.elements).toEqual([])
        person.assert({ id: 0, name: "marco" })
        expect(person.elements).toEqual([[0, "marco"]])
        person.assert({ id: 1, name: "daiyi" })
        expect(person.elements).toEqual([[0, "marco"], [1, "daiyi"]])
    });

    test('Can filter by constants', () => {
        // { id: PersonID, name: String}
        const person = newPerson()

        person.assert({ id: 0, name: "marco" })
        person.assert({ id: 1, name: "daiyi" })
        const filteredPeople = person.filterElements({ name: "marco" })
        expect(filteredPeople.elements).toEqual([[0, "marco"]])
    });

    test('indexBy', () => {
        const A = new datalog.RelationIndex<"a", number, { b: number }>([], ["a", "b"])
        A.assert({ a: 1, b: 2 })

        const B = A.indexBy(['b', 'a'])
        expect(B.elements).toEqual([[2, 1]])
    })

    test('ExtendWith & Leaper works', () => {
        // { id: PersonID, name: String}
        const person = newPerson()
        person.assert({ id: 0, name: "marco" })
        person.assert({ id: 1, name: "daiyi" })
        person.assert({ id: 2, name: "beba" })

        const personExtendedWith = person.extendWith(([id]: [PersonID]) => id);
        expect(personExtendedWith.count([0])).toEqual(1)
        // expect(personExtendedWith.propose([0])).toEqual([["marco"]])
        // expect(personExtendedWith.intersect([0], [["marcopolo"], ["marco"]])).toEqual([["marco"]])
    });

    test('ExtendWith & Leaper works', () => {
        // { id: PersonID, name: String}
        const person = newPerson()
        person.assert({ id: 0, name: "marco" })
        person.assert({ id: 0, name: "foo" })

        const personExtendedWith = person.extendWith(([id]: [PersonID]) => id);
        expect(personExtendedWith.count([0])).toEqual(2)
    });

    test('LeapJoin', () => {
        // { id: PersonID, name: String}
        const A = new datalog.RelationIndex<"a", number, { b: number }>([], ["a", "b"])
        const B = new datalog.RelationIndex<"b", number, { c: number }>([], ["b", "c"])
        const C = new datalog.RelationIndex<"a", number, { c: number }>([], ["a", "c"])

        A.assert({ a: 1, b: 2 })
        B.assert({ b: 2, c: 3 })
        B.assert({ b: 2, c: 4 })
        C.assert({ a: 1, c: 3 })

        const out: Array<[number, number, number]> = []
        datalog.leapJoinHelper(A, [B.extendWith(([_, b]) => b), C.extendWith(([a, _]) => a)], ([a, b], [c]) => {
            out.push([a, b, c])

        })
        expect(out).toEqual([[1, 2, 3]])
    });

    test('LeapJoin2', () => {
        // { id: PersonID, name: String}
        const A = new datalog.RelationIndex<"a", number, { b: number }>([], ["a", "b"])
        const B = new datalog.RelationIndex<"b", number, { c: number }>([], ["b", "c"])
        const C = new datalog.RelationIndex<"a", number, { c: number }>([], ["a", "c"])

        A.assert({ a: 1, b: 2 })
        B.assert({ b: 2, c: 3 })
        B.assert({ b: 2, c: 4 })
        C.assert({ a: 1, c: 3 })
        C.assert({ a: 1, c: 4 })

        const out: Array<[number, number, number]> = []
        datalog.leapJoinHelper(A, [B.extendWith(([_, b]) => b), C.extendWith(([a, _]) => a)], ([a, b], [c]) => {
            out.push([a, b, c])

        })

        expect(out).toEqual([[1, 2, 3], [1, 2, 4]])
    });

    test("join key ordering", () => {
        const out = datalog.joinKeyOrdering([
            ["a", "b"],
            ["b", "c"],
            ["a", "c", "d"]
        ])

        expect(out).toEqual(["a", "b", "c", "d"])
    })

    test("join key ordering 2", () => {
        const out = datalog.joinKeyOrdering([
            ["a", "b"],
            ["b", "a"],
        ])

        expect(out).toEqual(["a", "b"])
    })

    test('Using the Unconstrained symbol in joins to specify columns that are not constrained', () => {
        const A = new datalog.RelationIndex<"a", number, { b: number }>([], ["a", "b"])
        const B = new datalog.RelationIndex<"b", number, { c: number }>([], ["b", "c"])
        const C = new datalog.RelationIndex<"a", number, { c: number, d: number }>([], ["a", "c", "d"])

        A.assert({ a: 1, b: 2 })
        B.assert({ b: 2, c: 3 })
        B.assert({ b: 2, c: 4 })
        C.assert({ a: 1, c: 3, d: 0 })
        C.assert({ a: 1, c: 3, d: 2 })
        C.assert({ a: 1, c: 3, d: 4 })

        // const BLeaper = new datalog.ExtendWithUnconstrained(
        //     ([_a, b]: [number, number]) => b,
        //     ["c", "d"],
        //     B
        // )
        // expect(BLeaper.outputTupleFunc([3])).toEqual([3, datalog.Unconstrained])

        const out: Array<[number, number, ...(number | symbol)[]]> = []

        datalog.leapJoinHelper(A, [
            new datalog.ExtendWithUnconstrained(
                ([_a, b]) => [b],
                1,
                ["c", "d"],
                B,
                ["b", "c"]
            ),
            new datalog.ExtendWithUnconstrained(
                ([a, _b]) => [a],
                1,
                ["c", "d"],
                C,
                ["a", "c", "d"]
            ),
        ], ([a, b], rest) => {
            out.push([a, b, ...rest])
        })
        expect(out).toEqual([[1, 2, 3, 0], [1, 2, 3, 2], [1, 2, 3, 4]])

        expect(DataFrog.sortTuple([datalog.Unconstrained, 1], [2, 1])).toEqual(0)
    })

    test('Filter out missing keys', () => {
        // Say relation B has keys ['c', 'b']
        // and our output tuple key order is ['a', 'b', 'c', 'd']
        // We should index B by ['b', 'c']

        expect(
            datalog.filterKeys(['b', 'c'], ['a', 'b', 'c', 'd'])
        ).toEqual(['b', 'c'])



    })

    test('Order leaper keys', () => {
        let restKeys = [
            ['c', 'e'],
            ['c', 'd'],
            ['c', 'd', 'e'],
        ]

        let minIdx = 0
        restKeys.forEach((ks, i) => {
            if (ks.length < restKeys[minIdx].length) {
                minIdx = i
            }
        })

        let setWithLeastKeys = new Set(restKeys[minIdx])
        restKeys = restKeys.filter((_, i) => i !== minIdx)

        let currentIdx = 0

        // Split between common keys and rest of the keys
        const restKeysSplit: Array<[Array<string>, Array<string>]> = restKeys.map(() => [[], []])

        restKeys.forEach((ks, j) => {
            ks.forEach(rest_k => {
                if (setWithLeastKeys.has(rest_k)) {
                    restKeysSplit[j][0].push(rest_k)
                } else {
                    restKeysSplit[j][1].push(rest_k)
                }
            })
        })

        restKeys = restKeysSplit.map(([common, rest]) => common.concat(rest))
        // while (currentIdx < setWithLeastKeys.length) {
        //     const k = setWithLeastKeys[currentIdx]
        //     restKeys.forEach(ks => {
        //         ks
        //     })
        // }
    })
})

describe("MultiIndexRelations", () => {
    test("MultiIndex can indexBy", () => {
        const A = new datalog.Relation<{ a: number, b: number }>()
        A.assert({ a: 1, b: 2 })
        A.indexBy(['a', 'b'])
        expect(A.relations[0].elements).toEqual([[1, 2]])
        A.indexBy(['b', 'a'])
        expect(A.relations[0].elements).toEqual([[1, 2]])
        expect(A.relations[1].elements).toEqual([[2, 1]])
    })
})

describe("Variables", () => {
    test("Variables can be told stuff", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        A.assert({ a: 1, b: 2 })
        expect(A.changed()).toEqual(true)
        expect(A.changed()).toEqual(false)
        expect(A.stable.relations[0].keyOrdering).toEqual(["a", "b"])
        expect(A.stable.relations[0].elements).toEqual([[1, 2]])
        expect(A.changed()).toEqual(false)

        A.assert({ a: 1, b: 2 })
        expect(A.changed()).toEqual(false)
        expect(A.stable.relations[0].elements).toEqual([[1, 2]])

        A.assert({ a: 2, b: 3 })
        expect(A.changed()).toEqual(true)
        expect(A.changed()).toEqual(false)
        expect(A.stable.relations[0].elements).toEqual([[1, 2], [2, 3]])
    })

    test("Joining Variables", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        const B = new datalog.Variable<{ b: number, c: number }>()
        const C = new datalog.Variable<{ c: number, a: number, d: number }>()
        A.assert({ a: 1, b: 2 })
        B.assert({ b: 2, c: 3 })
        B.assert({ b: 2, c: 4 })
        C.assert({ a: 1, c: 3, d: 5 })
        C.assert({ a: 1, c: 3, d: 7 })

        let out: Array<{ a: number, b: number, c: number, d: number }> = []
        datalog.variableJoinHelper(join => out.push(join), [A, B, C], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }, { a: 'a', c: 'c', d: 'd' }], [{}, {}, {}])

        expect(out).toEqual([
            { a: 1, b: 2, c: 3, d: 5 },
            { a: 1, b: 2, c: 3, d: 7 }
        ])
    })

    test("Joining Empty Variables", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        const B = new datalog.Variable<{ b: number, c: number }>()
        const C = new datalog.Variable<{ c: number, a: number, d: number }>()

        let out: Array<{ a: number, b: number, c: number, d: number }> = [...datalog.variableJoinHelperGen([A, B, C], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }, { a: 'a', c: 'c', d: 'd' }], [{}, {}, {}])]

        expect(out).toEqual([])
    })

    test("Joining 1 Variable", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()

        let out: Array<{ a: number, b: number }> = [...datalog.variableJoinHelperGen([A], [{ a: 'a', b: 'b' }], [{}])]
        expect(out).toEqual([])

        A.assert({ a: 1, b: 2 })
        out = [...datalog.variableJoinHelperGen([A], [{ a: 'a', b: 'b' }], [{}])]
        console.log('out is', out)
        expect(out).toEqual([{ a: 1, b: 2 }])
    })

    test("Joining 1 Variable with constants", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()

        let out: Array<{ a: number, b: number }> = [...datalog.variableJoinHelperGen([A], [{ a: 'a', b: 'b' }], [{}])]
        expect(out).toEqual([])

        A.assert({ a: 1, b: 2 })
        A.assert({ a: 2, b: 3 })
        out = [...datalog.variableJoinHelperGen([A], [{ a: 'a', b: 'b' }], [{ a: 1 }])]
        expect(out).toEqual([{ a: 1, b: 2 }])
    })

    test("Joining 2 Variables", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        const B = new datalog.Variable<{ b: number, c: number }>()

        let out: Array<{ a: number, b: number, c: number }> = [...datalog.variableJoinHelperGen([A, B], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }], [{}, {}])]
        expect(out).toEqual([])

        A.assert({ a: 1, b: 2 })
        A.assert({ a: 1, b: 4 })
        B.assert({ b: 2, c: 3 })
        out = [...datalog.variableJoinHelperGen([A, B], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }], [{}, {}])]
        expect(out).toEqual([{ a: 1, b: 2, c: 3 }])
    })


    test("Joining 2 Variables with constants", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        const B = new datalog.Variable<{ b: number, c: number }>()

        let out: Array<{ a: number, b: number, c: number }> = [...datalog.variableJoinHelperGen([A, B], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }], [{}, {}])]
        expect(out).toEqual([])

        A.assert({ a: 1, b: 2 })
        A.assert({ a: 1, b: 4 })
        A.assert({ a: 2, b: 2 })
        A.assert({ a: 3, b: 2 })
        B.assert({ b: 2, c: 3 })
        out = [...datalog.variableJoinHelperGen([A, B], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }], [{ a: 1 }, {}])]
        expect(out).toEqual([{ a: 1, b: 2, c: 3 }])

    })

    test("Joining 2 Variables with constants 2", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        const B = new datalog.Variable<{ b: number, c: number }>()

        let out: Array<{ a: number, b: number, c: number }> = [...datalog.variableJoinHelperGen([A, B], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }], [{}, {}])]
        expect(out).toEqual([])

        A.assert({ a: 1, b: 2 })
        A.assert({ a: 1, b: 4 })
        A.assert({ a: 2, b: 5 })
        A.assert({ a: 3, b: 4 })
        B.assert({ b: 2, c: 3 })

        out = [...datalog.variableJoinHelperGen([A, B], [{ a: 'a', b: 'b' }, { b: 'b', c: 'c' }], [{}, { c: 3 }])]
        expect(out).toEqual([{ a: 1, b: 2, c: 3 }])
    })

    test("Joining 1 Variable with remapped keys", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()

        // let out: Array<{ a2: number, b2: number }> = [...datalog.variableJoinHelperGen([A], [{ a: 'a', b: 'b' }])]
        // expect(out).toEqual([])

        A.assert({ a: 1, b: 2 })
        // @ts-ignore
        let out = [...datalog.variableJoinHelperGen<{ a: number, b: number }, { a2: number, b2: number }>([A], [{ a: 'a2', b: 'b2' }], [{}])]
        expect(out).toEqual([{ a2: 1, b2: 2 }])
    })

    test("Joining same Variable with itself with remapped keys", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()

        A.assert({ a: 1, b: 2 })
        A.assert({ a: 2, b: 1 })
        A.assert({ a: 3, b: 1 })
        A.assert({ a: 5, b: 1 })
        A.assert({ a: 3, b: 2 })
        // @ts-ignore
        let out = [...datalog.variableJoinHelperGen<{ a: number, b: number }, { b: number, a: number }>([A, A], [{ a: 'a', b: 'b' }, { a: 'b', b: 'a' }], [{}, {}])]
        expect(out).toEqual([{ a: 1, b: 2 }, { a: 2, b: 1 }])
    })

    test("Joining same Variable with itself with remapped keys", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()

        A.assert({ a: 3, b: 4 })
        A.assert({ a: 1, b: 2 })
        A.assert({ a: 1, b: 1 })
        // @ts-ignore
        let out = [...datalog.variableJoinHelperGen([A, A], [{ a: 'a' }, { b: 'a' }], [{}, {}])]
        // TODO this should be just one value
        expect(out).toEqual([{ a: 1 }, { a: 1 }])
    })

    test("Joining non-overlapping relations", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        const B = new datalog.Variable<{ c: number, d: number }>()

        A.assert({ a: 1, b: 2 })
        A.assert({ a: 3, b: 4 })
        B.assert({ c: 5, d: 6 })
        B.assert({ c: 7, d: 8 })

        // @ts-ignore
        let out = [...datalog.variableJoinHelperGen<{ a: number, b: number }, { c: number, d: number }>([A, B], [{ a: 'a', b: 'b' }, { c: 'c', d: 'd' }], [{}, {}])]
        expect(out).toEqual([
            {
                "a": 1,
                "b": 2,
                "c": 5,
                "d": 6,
            },
            {
                "a": 1,
                "b": 2,
                "c": 7,
                "d": 8,
            },
            {
                "a": 3,
                "b": 4,
                "c": 5,
                "d": 6,
            },
            {
                "a": 3,
                "b": 4,
                "c": 7,
                "d": 8,
            }
        ])
    })

    test.skip("Cross Product Variable Join (no common keys)", () => {
        const A = new datalog.Variable<{ a: number, b: number }>()
        const B = new datalog.Variable<{ c: number }>()

        A.assert({ a: 1, b: 2 })
        B.assert({ c: 3 })
        B.assert({ c: 4 })

        let out: Array<{ a: number, b: number, c: number }> = [...datalog.crossJoinVariables([A, B])]
        expect(out).toEqual([{ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 4 }])
    })

})

describe("recursiveForLoopJoin", () => {
    const A = [{ a: 1, b: 2 }]
    const B = [{ b: 2, c: 3 }]
    const C = [{ a: 1, c: 3 }]

    // resultSoFar is an array of datums i.e.: [{a: 1, b: 2}, {b: 2, c: 3}]
    const mockJoinerHelper = function* (rels: Array<any>, resultSoFar: any): Generator<any> {
        if (rels.length === 0) {
            const allKeys = new Set(resultSoFar.map((datum: any) => Object.keys(datum)).flat())
            const keysPerDatum = resultSoFar.map((datum: any) => new Set(Object.keys(datum)))
            const commonKeys = [...allKeys].filter(k => keysPerDatum.every((s: any) => s.has(k)))
            const areCommonKeysTheSame = commonKeys.every((k: any) => {
                const s = new Set(resultSoFar.map((datum: any) => datum[k]))
                return s.size === 1
            })
            if (areCommonKeysTheSame) {
                yield resultSoFar.reduce((acc: any, o: any) => ({ ...acc, ...o }), {})
            }
        } else {
            const [head, ...tail] = rels
            for (let item of head) {
                yield* mockJoinerHelper(tail, resultSoFar.concat([item]))
            }
        }
    }


    const mockJoiner = function* (...rels: Array<any>) {
        yield* mockJoinerHelper(rels, [])
    }


    const mockRemapKeys = <T extends { [key: string]: any }>(rel: Array<T>, keyMap: { [key: string]: string }): Array<Partial<T> & { [key: string]: any }> => {
        return rel.map(datum => Object.keys(datum).reduce((acc, k) => {
            const newK = keyMap[k]
            if (newK) {
                acc[newK] = datum[k]
            }

            return acc
        }, {} as any))

    }


    test("Mock joiner works", () => {
        expect([...mockJoiner(A, B)]).toEqual([{ a: 1, b: 2, c: 3 }])
        expect([...mockJoiner(A, B, C)]).toEqual([{ a: 1, b: 2, c: 3 }]);
        {
            const C = [{ a: 1, c: 3 }, { a: 1, c: 4 }]
            expect([...mockJoiner(A, B, C)]).toEqual([{ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 4 }])
        }
    })

    test("Mock remap keys works", () => {
        expect(mockRemapKeys(A, { a: 'a2', b: 'b' })).toEqual([{ a2: 1, b: 2 }])
    })

    test("joins 1 part", () => {
        const parts: Array<Array<[any, { [key: string]: string }]>> = [
            [[A, { a: 'a', b: 'b' }], [B, { b: 'b', c: 'c' }]]
        ]
        const it = datalog.recursiveForLoopJoin(parts, {}, mockRemapKeys, mockJoiner)
        expect([...it]).toEqual([{ a: 1, b: 2, c: 3 }])
    })

    test("joins 2 part", () => {
        const parts: Array<Array<[any, { [key: string]: string }]>> = [
            [[A, { a: 'a', b: 'b' }]], [[B, { b: 'b2', c: 'c' }]]
        ]

        const it = datalog.recursiveForLoopJoin(parts, {}, mockRemapKeys, mockJoiner)
        expect([...it]).toEqual([{ a: 1, b: 2, b2: 2, c: 3 }])
    })

    test("Joins twice, then one more time", () => {
        const parts: Array<Array<[any, { [key: string]: string }]>> = [
            [[A, { a: 'a', b: 'b' }], [B, { b: 'b', c: 'c' }]],
            [[B, { b: 'b2', c: 'c2' }]]
        ]

        const it = datalog.recursiveForLoopJoin(parts, {}, mockRemapKeys, mockJoiner)
        expect([...it]).toEqual([{ a: 1, b: 2, b2: 2, c: 3, c2: 3 }])
    })
})

describe("Helpers", () => {
    test("Remap keys", () => {
        const inKeys = ["a", "b", "c", "d"]
        const mapping = { a: "a2", c: "c4", d: "d" }
        const out = datalog.remapKeys(inKeys, mapping)
        expect(out).toEqual(["a2", "b", "c4", "d"])
        expect(datalog.reverseRemapKeys(out, mapping)).toEqual(inKeys)
    })
})

describe("Query", () => {
    test("Hello World join", () => {
        const A = datalog.newQueryableVariable<{ a: number, b: number }>()
        const B = datalog.newQueryableVariable<{ b: number, c: number }>()
        A.assert({ a: 1, b: 2 })
        B.assert({ b: 2, c: 3 })

        const queryResult = datalog.query(({ a, b, c }: any) => {
            A({ a, b })
            B({ b, c })
        })
        expect([...queryResult.recentData()]).toEqual([{ a: 1, b: 2, c: 3 }])
    })

    test("People Example", () => {
        type ID = number
        const People = datalog.newQueryableVariable<{ name: string, id: ID }>()
        const ParentOf = datalog.newQueryableVariable<{ parentID: ID, childID: ID }>()

        let ids = 0

        People.assert({ name: "FooChild", id: ids++ })
        People.assert({ name: "FooDad", id: ids++ })
        People.assert({ name: "FooMom", id: ids++ })

        People.assert({ name: "BarChild", id: ids++ })
        People.assert({ name: "BarDad", id: ids++ })
        People.assert({ name: "BarMom", id: ids++ })

        ParentOf.assert({ parentID: 1, childID: 0 }) // 1 = FooDad, 0 = FooChild
        ParentOf.assert({ parentID: 2, childID: 0 }) // 2 = FooMom, 0 = FooChild

        ParentOf.assert({ parentID: 4, childID: 3 }) // 4 = BarDad, 3 = BarChild
        ParentOf.assert({ parentID: 5, childID: 3 }) // 5 = BarMom, 3 = BarChild

        // Find every parent
        let queryResult = datalog.query<{ parentName: string, parentID: number }>(({ parentName, parentID }) => {
            ParentOf({ parentID })
            People({ id: parentID, name: parentName })
        })

        expect([...queryResult.recentData()]).toEqual([{ parentID: 1, parentName: "FooDad" }, { parentID: 2, parentName: "FooMom" }, { parentID: 4, parentName: "BarDad" }, { parentID: 5, parentName: "BarMom" }])
    })

    test("People Example", () => {
        type ID = number
        const People = datalog.newQueryableVariable<{ name: string, id: ID }>()
        const ParentOf = datalog.newQueryableVariable<{ parentID: ID, childID: ID }>()

        let ids = 0

        People.assert({ name: "FooChild", id: ids++ })
        People.assert({ name: "FooDad", id: ids++ })
        People.assert({ name: "FooMom", id: ids++ })

        ParentOf.assert({ parentID: 1, childID: 0 }) // 1 = FooDad, 0 = FooChild
        ParentOf.assert({ parentID: 2, childID: 0 }) // 1 = FooMom, 0 = FooChild

        // Who's FooChild's parent?
        let queryResult = datalog.query<{ parentName: string, parentID: number }>(({ parentName, childID, parentID }: any) => {
            People({ name: "FooChild", id: childID })
            ParentOf({ childID, parentID })
            People({ id: parentID, name: parentName })
        })
        // Equivalent SQL query: (https://www.db-fiddle.com/f/t1TA5umdcoBuG8ZPcyMWTx/1)
        // select child.name as childName, ParentOf.childID, ParentOf.parentID, parent.name as parentName
        // from People child, People parent, ParentOf
        // where child.name = 'FooChild' and child.id = childID and parent.id = parentID


        expect([...queryResult.recentData()]).toEqual([{ parentID: 1, parentName: "FooDad", childID: 0 }, { parentID: 2, parentName: "FooMom", childID: 0 }])
    })

    test("People Example. Then query result", () => {
        type ID = number
        const People = datalog.newQueryableVariable<{ name: string, id: ID }>()
        const ParentOf = datalog.newQueryableVariable<{ parentID: ID, childID: ID }>()

        let ids = 0

        People.assert({ name: "FooChild", id: ids++ })
        People.assert({ name: "FooDad", id: ids++ })
        People.assert({ name: "FooMom", id: ids++ })

        ParentOf.assert({ parentID: 1, childID: 0 }) // 1 = FooDad, 0 = FooChild
        ParentOf.assert({ parentID: 2, childID: 0 }) // 1 = FooMom, 0 = FooChild

        // Who's FooChild's parent?
        let QueryResult = datalog.query<{ parentName: string, parentID: number }>(({ parentName, childID, parentID }: any) => {
            People({ name: "FooChild", id: childID })
            ParentOf({ childID, parentID })
            People({ id: parentID, name: parentName })
        })

        console.log("Query result is", QueryResult)

        let QueryResult2 = datalog.query(({ parentID }: { parentID: number }) => {
            QueryResult({ parentName: "FooMom", parentID })
        })
        console.log("Query result 2 is", QueryResult2)

        expect([...QueryResult2.recentData()]).toEqual([{ parentID: 2 }])
    })

    test("People Example 3 joins", () => {
        type ID = number
        const People = datalog.newQueryableVariable<{ name: string, id: ID }>()
        const ParentOf = datalog.newQueryableVariable<{ parentID: ID, childID: ID }>()
        const A = datalog.newQueryableVariable<{ a: number, b: number }>()
        const B = datalog.newQueryableVariable<{ b: number, c: number }>()

        let ids = 0

        People.assert({ name: "FooChild", id: ids++ })
        People.assert({ name: "FooDad", id: ids++ })
        People.assert({ name: "FooMom", id: ids++ })

        ParentOf.assert({ parentID: 1, childID: 0 }) // 1 = FooDad, 0 = FooChild
        ParentOf.assert({ parentID: 2, childID: 0 }) // 1 = FooMom, 0 = FooChild

        A.assert({ a: 1, b: 2 })
        B.assert({ b: 2, c: 3 })

        // Who's FooChild's parent?
        let queryResult = datalog.query<{ id: number, parentName: string, parentID: number, a: number, b: number, c: number }>(({ parentName, childID, parentID, a, b, c }: any) => {
            People({ name: "FooChild", id: childID })
            ParentOf({ childID, parentID })
            People({ id: parentID, name: parentName })
            A({ a, b })
            B({ b, c })
        })
        // Equivalent SQL query: (https://www.db-fiddle.com/f/t1TA5umdcoBuG8ZPcyMWTx/1)
        // select child.name as childName, ParentOf.childID, ParentOf.parentID, parent.name as parentName
        // from People child, People parent, ParentOf
        // where child.name = 'FooChild' and child.id = childID and parent.id = parentID

        // console.log("data", queryResult)
        const data = queryResult.recentData()

        expect(data).toEqual([{ parentID: 1, parentName: "FooDad", childID: 0, a: 1, b: 2, c: 3 }, { parentID: 2, parentName: "FooMom", childID: 0, a: 1, b: 2, c: 3 }])
    })
})

// const fs = require('fs')
// const homedir = require('os').homedir();
// const titles = fs.readFileSync(`${homedir}/datasets/imdb/title1k.basics.tsv`).toString().split('\n').slice(1)
// describe.only("IMDB examples", () => {
//     test("Movie titles", () => {
//         const MovieTitle = datalog.newQueryableVariable<{ tconst: string, titleType: string, primaryTitle: string, originalTitle: string, isAdult: number, startYear: string, endYear: string, runTimeMinutes: number, genres: string }>()
//         for (const title of titles) {
//             const [tconst, titleType, primaryTitle, originalTitle, isAdult, startYear, endYear, runTimeMinutes, genres] = title.split('\t')
//             MovieTitle.assert({ tconst, titleType, primaryTitle, originalTitle, isAdult: parseInt(isAdult), startYear, endYear, runTimeMinutes: parseInt(runTimeMinutes), genres })
//         }
//         const queryResult = datalog.query(({ primaryTitle, startYear }: any) => {
//             People({ name: "FooChild", id: c })
//             ParentOf({ c, p })
//             People({ id: p, name: parentName })
//         })
//     })
// })







// ------------------------------ random notes
// I need to convert the pretty syntax into the above

// Something like:

// query(({a, b, c}: {a: number, b: number, c: number}) => {
//  A({a, b})
//  B({b, c})
// })

// Becomes

// function* () {
//   for (let {a, b, C} of datalog.variableJoinHelperGen(A, B)) {
//     yield {a, b, c}
//   }
// }

// query(({a, b, c}: {a: number, b: number, c: number}) => {
//  A({a, b})
//  B({c})
// })

// Becomes

// function* () {
//   for (let {a, b} of datalog.variableJoinHelperGen(A)) {
//     for (let {c} of datalog.variableJoinHelperGen(B)) {
//       yield {a, b, c}
//     }
//   }
// }

// first make a list of fn calls. i.e. [A, B], along with a list of their parameters: [{a: 'a', b: 'b'}, {c: 'c'}]
// Transform those into two lists [[[A, {a: 'a', b: 'b'}]], [[B, {c: 'c'}]]]

// then that gets transformed into:
// function* () {
//   for (let {a, b} of datalog.variableJoinHelperGen(A)) {
//     for (let {c} of datalog.variableJoinHelperGen(B)) {
//       yield {a, b, c}
//     }
//   }
// }

// in the case of the triangle join on A B C
// query(({a, b, c}) => {
//  A({a, b})
//  B({b, c})
//  C({c, a})
// })
// Transform those into two lists: [[[A, {a: 'a', b: 'b}], [B, {b: 'b', c: 'c'}], [C: {c: 'c', a: 'a'}]]]
// that gets transformed into:
// function* () {
//   for (let {a, b, c} of datalog.variableJoinHelperGen(A, B, C)) {
//     yield {a, b, c}
//   }
// }

// in the case of the rename:
// query(({a1, a2}: {a1: number, a2: number}) => {
//  A({a: a1})
//  A({a: a2})
// })
// Transform those into two lists: [[[A, {a: 'a1'}]], [[A, {a: 'a2'}]]]
// that gets transformed into:
// function* () {
//   for (let {a: a1} of datalog.variableJoinHelperGen(A)) {
//     for (let {a: a2} of datalog.variableJoinHelperGen(A)) {
//       yield {a1, a2}
//     }
//   }
// }


// in the case:
// query(({a, b1, b2}) => {
//  A({a: a, b: b1})
//  A2({a: a, b: b2})
// })
// Transform those into two lists: [[[A, {a: 'a1'}]], [[A, {a: 'a2'}]]]
// that gets transformed into:
// function* () {
//   for (let {a, b1, b2} of datalog.variableJoinHelperGen(remapKeys(A, {b: 'b1'}), remapKeys(A2, {b: 'b2'}))) {
//     yield {a1, a2}
//   }
// }

// Something like:

// query(({a, b, c}: {a: number, b: number, c: number}) => {
//  A({a, b})
//  B({b, c})
//  console.log(a, b, c)
// })

// Transform those into two lists: [[[A, {a: 'a', b: 'b'}], [B, {b: 'b',  c: 'c'}], { eval: "console.log(a,b,c)" }], []]
// Becomes

// function* () {
//   for (let {a, b, c} of datalog.variableJoinHelperGen(A, B)) {
//     console.log(a, b, c)
//     yield {a, b, c}
//   }
// }

// query(({a, b, c}: {a: number, b: number, c: number}) => {
//  A({a, b})
//  A({a: b, b: a})
//  console.log(a, b)
// })

// Transform those into two lists: [[[A, {a: 'a', b: 'b'}], [B, {b: 'b',  c: 'c'}], { eval: "console.log(a,b,c)" }], []]
// Becomes

// function* () {
//   for (let {a, b} of datalog.variableJoinHelperGen(A, remapKeys(A, {a: 'b', b: 'a'}))) {
//     console.log(a, b, c)
//     yield {a, b, c}
//   }
// }

// query(({a, b, c}: {a: number, b: number, c: number}) => {
//  A({a, b})
//  A2({a, b})
// })

// Transform those into two lists: [[[A, {a: 'a', b: 'b'}], [B, {b: 'b',  c: 'c'}], { eval: "console.log(a,b,c)" }], []]
// Becomes

// function* () {
//   for (let {a, b} of datalog.variableJoinHelperGen(A, remapKeys(A2, {a, b}))) {
//     yield {a, b, c}
//   }
// }