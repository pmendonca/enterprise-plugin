'use strict';

const javascriptPolicy = require('./javascript');

const serviceData = { declaration: { provider: { stage: 'dev' } } };

describe('javascriptPolicy', () => {
  let policy;

  beforeEach(() => {
    policy = { approve: jest.fn(), fail: jest.fn() };
  });

  it('allows services with options ["declaration.provider[stage=dev]"]', () => {
    javascriptPolicy(
      policy,
      serviceData,
      JSON.stringify('jsonata("declaration.provider[stage=\'dev\']")')
    );
    expect(policy.approve).toHaveBeenCalledTimes(1);
    expect(policy.fail).toHaveBeenCalledTimes(0);
  });

  it('allows services with options ["declaration.provider[stage in [dev, staging]"]', () => {
    javascriptPolicy(
      policy,
      serviceData,
      JSON.stringify("jsonata(\"declaration.provider[stage in ['dev','stage']]\")")
    );
    expect(policy.approve).toHaveBeenCalledTimes(1);
    expect(policy.fail).toHaveBeenCalledTimes(0);
  });

  it('requires all queries to pass', () => {
    const rules = JSON.stringify(
      `jsonata("declaration.provider[stage='dev']")
      &&
       jsonata("declaration.provider[stage='prod']")`
    );
    javascriptPolicy(policy, serviceData, rules);
    expect(policy.approve).toHaveBeenCalledTimes(0);
    expect(policy.fail).toHaveBeenCalledTimes(1);
  });

  it('forbids services with options ["declaration.provider[stage=prod"]', () => {
    javascriptPolicy(
      policy,
      serviceData,
      JSON.stringify('jsonata("declaration.provider[stage=\'prod\']")')
    );
    expect(policy.approve).toHaveBeenCalledTimes(0);
    expect(policy.fail).toBeCalledWith('Must comply with all of the configured queries.');
  });

  it('forbids invalid queries', () => {
    javascriptPolicy(policy, serviceData, JSON.stringify('this is not a valid query'));
    expect(policy.approve).toHaveBeenCalledTimes(0);
    expect(policy.fail).toBeCalledWith(
      'Error in the policy statement: "this is not a valid query"'
    );
  });

  it('allows javascript statements', () => {
    const rules = JSON.stringify('5==5');
    javascriptPolicy(policy, serviceData, rules);
    expect(policy.approve).toHaveBeenCalledTimes(1);
    expect(policy.fail).toHaveBeenCalledTimes(0);
  });

  it('allows javascript statements with services', () => {
    const rules = JSON.stringify('declaration.provider.stage == "dev"');
    javascriptPolicy(policy, serviceData, rules);
    expect(policy.approve).toHaveBeenCalledTimes(1);
    expect(policy.fail).toHaveBeenCalledTimes(0);
  });

  it('forbids failed javascript statements', () => {
    const rules = JSON.stringify('declaration.provider.stage == "prod"');
    javascriptPolicy(policy, serviceData, rules);
    expect(policy.approve).toHaveBeenCalledTimes(0);
    expect(policy.fail).toHaveBeenCalledTimes(1);
  });

  it('works with multi line JS', () => {
    const rules = JSON.stringify(`

// These rules are examples of rules you can implement with this safeguard.

// Stage must be "dev", you can user the jsonata()
jsonata("declaration.provider[stage='dev']") // using jsonata
// declaration.provider.stage=='dev' // using plain JS

// Region must be us-east-1 or us-east-2
// jsonata("declaration.provider[region in ['us-east-1', 'us-east-2']]")
`);
    javascriptPolicy(policy, serviceData, rules);
    expect(policy.approve).toHaveBeenCalledTimes(1);
    expect(policy.fail).toHaveBeenCalledTimes(0);
  });
});
