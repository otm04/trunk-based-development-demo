# Trunk-based development: delivery and checkout

A five-minute teaching demo for Otmane Aberchane: why short-lived branches help continuous integration.

## The idea

Two branches can pass separately while their combined changes fail. Frequent integration exposes incompatible assumptions sooner, while changes are small. This demo stages divergence instantly; it illustrates the mechanism rather than measuring branch age.

## Run the working application tests

Requires Git and Node.js 24. No dependency installation is needed.

```sh
git clone https://github.com/otm04/trunk-based-development-demo.git
cd trunk-based-development-demo
node --test shipping.test.js checkout.test.js
```

Orders below 50 pay 5 for delivery. Orders of 50 or more have free delivery. Checkout for 80 should total 80.

## Reproduce the full branch demo

```sh
node run-demo.mjs
```

The script creates a new isolated repository in `demo-runs/`. It checks:

1. Developer A changes `shippingCost(number)` to `shippingCost({ subtotal })`. Its tests pass.
2. Developer B adds checkout against the old API. Its tests pass.
3. Git combines the code without file conflicts. Checkout fails: actual 85, expected 80.
4. Updating checkout to call `shippingCost({ subtotal })` makes the same tests pass.
5. The fixed code integrates into main, and the temporary branches are deleted.

The printed repository contains `demo-base`, `demo-broken`, and `demo-fixed` tags, plus local text logs.

## Two-minute live demonstration

After running the script, open the generated repository whose path it prints:

```sh
git switch --detach demo-broken
node --test shipping.test.js checkout.test.js
```

Show the failure. In `checkout.js`, replace `shippingCost(subtotal)` with `shippingCost({ subtotal })`, then run the same command again. The assertions remain unchanged.

## Hosted CI

[View GitHub Actions runs](https://github.com/otm04/trunk-based-development-demo/actions).

CI runs the application tests on pushes and pull requests. A workflow alone does not enforce a merge gate; required checks need repository rules. The local reproduction script preserves the deliberately staged failure and fix in its generated repository.

## Honest scope

The integration failure is deliberately constructed teaching material. It is not claimed as an unexpected personal setup incident. The presenter's assignment additionally requires a screenshot of a real error they encounter, slides, and their own explanation. Short-lived branches reduce feedback delay; they do not guarantee correctness. Compatible API migrations are preferable when practical.

## Sources

- [GitHub official documentation: Building and testing Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [Trunk Based Development: Short-Lived Feature Branches](https://trunkbaseddevelopment.com/short-lived-feature-branches/)

