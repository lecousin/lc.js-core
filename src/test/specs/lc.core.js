describe("Test lc.core.js", function() {
	it("lc.core.namespace", function() {
		expect(typeof window).not.toBeUndefined();
		expect(typeof test_lc_namespace).toEqual("undefined");
		lc.core.namespace("test_lc_namespace.ns1.sns", { ok: true });
		expect(test_lc_namespace.ns1.sns.ok).toBe(true);
	});
});