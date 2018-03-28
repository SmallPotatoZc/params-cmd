// Generated by CoffeeScript 2.0.2
  // # Parameters

  // Usage: `parameters(config)`

  // ## About options

  // Options are defined at the "config" level or for each command.

  // ## About main

  // Main is what's left after the options. Like options, "main" is 
  // defined at the "config" level or for each command.

  // Parameters are defined with the following properties:

  // * name:     name of the two dash parameter in the command (eg "--my_name") and in the returned parse object unless label is defined.
  // * label:    not yet implemented, see name
  // * shortcut: name of the one dash parameter in the command (eg "-n"), must be one charactere
  // * required: boolean, throw an exception when true and the parameter is not defined
  // * type:     one of 'string', 'boolean', 'integer' or 'array'
  var Parameters, array_to_object, is_object, load, merge, pad, set_default, types,
  indexOf = [].indexOf;

Parameters = function(config = {}) {
  var command, sanitize_command, sanitize_commands, sanitize_commands_enrich, sanitize_options, sanitize_options_enrich;
  this.config = config;
  // Sanitize options
  sanitize_options = function(config) {
    var name, option, ref, ref1, results;
    if (config.options == null) {
      config.options = {};
    }
    if (Array.isArray(config.options)) {
      // Convert from object with keys as options name to an array
      config.options = array_to_object(config.options, 'name');
    }
    ref = config.options;
    results = [];
    for (name in ref) {
      option = ref[name];
      option.name = name;
      // Access option by key
      if (option.type == null) {
        option.type = 'string';
      }
      if (ref1 = option.type, indexOf.call(types, ref1) < 0) {
        console.error(`Invalid option type ${JSON.stringify(option.type)}`);
      }
      if (option.shortcut) {
        config.shortcuts[option.shortcut] = option.name;
      }
      if (typeof option.one_of === 'string') {
        option.one_of = [option.one_of];
      }
      if (option.one_of && !Array.isArray(option.one_of)) {
        console.error(`Invalid option one_of "${JSON.stringify(option.one_of)}"`);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };
  sanitize_command = function(command, parent) {
    if (command.strict == null) {
      command.strict = parent.strict;
    }
    command.shortcuts = {};
    if (command.command == null) {
      command.command = parent.command;
    }
    sanitize_options(command);
    sanitize_commands(command);
    return command;
  };
  sanitize_commands = function(config) {
    var command, name, ref, results;
    if (config.commands == null) {
      config.commands = {};
    }
    if (Array.isArray(config.commands)) {
      config.commands = array_to_object(config.commands, 'name');
    }
    ref = config.commands;
    results = [];
    for (name in ref) {
      command = ref[name];
      if (command.name && command.name !== name) {
        console.error(`Incoherent Command Name: key ${JSON.stringify(name)} is not equal with name ${JSON.stringify(command.name)}`);
      }
      command.name = name;
      // command.description ?= "No description yet for the #{command.name} command"
      results.push(sanitize_command(command, config));
    }
    return results;
  };
  // An object where key are command and values are object map between shortcuts and names
  if (config.name == null) {
    config.name = 'myapp';
  }
  config.root = true;
  if (config.description == null) {
    config.description = 'No description yet';
  }
  config.shortcuts = {};
  if (config.strict == null) {
    config.strict = false;
  }
  if (config.command == null) {
    config.command = 'command';
  }
  sanitize_options(config);
  sanitize_commands(config);
  if (Object.keys(config.commands).length) {
    command = sanitize_command({
      name: 'help',
      description: `Display help information about ${config.name}`,
      main: {
        name: 'name',
        description: 'Help about a specific command'
      },
      help: true
    }, config);
    config.commands[command.name] = merge(command, config.commands[command.name]);
  }
  // Second pass, add help options and set default
  sanitize_options_enrich = function(command) {
    var _, cmd, ref, results;
    // No "help" option for command "help"
    if (!command.help) {
      command.options['help'] = merge(command.options['help'], {
        name: 'help',
        shortcut: 'h',
        description: 'Display help information',
        type: 'boolean',
        help: true
      });
      if (command.options['help'].shortcut) {
        command.shortcuts[command.options['help'].shortcut] = command.options['help'].name;
      }
    }
    ref = command.commands;
    results = [];
    for (_ in ref) {
      cmd = ref[_];
      results.push(sanitize_options_enrich(cmd));
    }
    return results;
  };
  sanitize_options_enrich(config);
  sanitize_commands_enrich = function(config) {
    var name, ref, results;
    ref = config.commands;
    results = [];
    for (name in ref) {
      command = ref[name];
      if (command.description == null) {
        command.description = `No description yet for the ${command.name} command`;
      }
      results.push(sanitize_commands_enrich(command, config));
    }
    return results;
  };
  sanitize_commands_enrich(config);
  return this;
};

// ## `run(argv)` or `run(params)` or `run(process)`

// * `argv`   
//   Array of arguments to parse, optional.
// * `params`   
//   Paramters object as returned by `parse`, optional.
// * `process`   
//   The Node.js process object, optional.

// Parse the arguments and execute the module defined by the "module" option.

// You should only pass the parameters and the not the script name.

// Example:

// ```
//   result = parameters(
//     commands: [
//       name: 'start'
//       run: function(){ return 'something'; }
//       options: [
//         name: 'debug'
//       ]
//     ]
//   ).run ['start', '-d', 'Hello']
// ```
Parameters.prototype.run = function(argv = process, ...args) {
  var commands, extended, helpconfig, inject, params, run;
  if (Array.isArray(argv)) {
    params = this.parse(argv);
  } else if (argv === process) {
    params = this.parse(argv);
  } else if (is_object(argv)) {
    params = argv;
  } else {
    console.error(`Invalid Arguments: first argument must be an argv array, a params object or the process object, got ${JSON.stringify(argv)}`);
  }
  // Print help
  // return unless params
  if (commands = this.helping(params)) {
    [helpconfig] = Object.values(this.config.commands).filter(function(command) {
      return command.help;
    });
    if (!helpconfig) {
      console.error("No Help Command");
    }
    run = helpconfig.run;
    if (!run) {
      console.error('Missing "run" definition for help: please insert a command of name "help" with a "run" property inside');
    }
  } else if (params[this.config.command]) {
    run = this.config.commands[params[this.config.command]].run;
    extended = this.config.commands[params[this.config.command]].extended;
    if (!run) {
      console.error(`Missing "run" definition for command ${JSON.stringify(params[this.config.command])}`);
    }
  } else {
    run = this.config.run;
    extended = this.config.extended;
    if (!run) {
      console.error('Missing run definition');
    }
  }
  if (typeof run === 'string') {
    // Load the module
    run = this.load(run);
  }
  inject = [params];
  if (extended) {
    inject.push(argv);
  }
  if (extended) {
    inject.push(this.config);
  }
  return run.call(this, ...inject, ...args);
};

// ## `parse([argv])`

// * `argv`   
//   Array of arguments to parse, optional.

// Convert process arguments into a usable object. Argument may
// be in the form of a string or an array. If not provided, it 
// parse the arguments present in  `process.argv`.

// You should only pass the parameters and the not the script name.

// Example:

// ```
// params = argv.parse ['start', '--watch', __dirname, '-s', 'my', '--command']
// params.should.eql
//   action: 'start'
//   watch: __dirname
//   strict: true
//   command: 'my --command'
// ```
Parameters.prototype.parse = function(argv = process) {
  var config, index, params, parse;
  if (typeof argv === 'string') {
    argv = argv.split(' ');
  }
  index = 0;
  // Remove node and script argv elements
  if (argv === process) {
    index = 2;
    argv = argv.argv;
  }
  // Extracted parameters
  params = {};
  parse = (config) => {
    var _, command, helping, j, key, leftover, len, main, option, ref, ref1, ref2, shortcut, type, value, values;
    // Read options
    while (true) {
      if (argv.length === index || argv[index][0] !== '-') {
        break;
      }
      key = argv[index++];
      shortcut = key[1] !== '-';
      key = key.substring((shortcut ? 1 : 2), key.length);
      if (shortcut) {
        shortcut = key;
      }
      if (shortcut) {
        key = config.shortcuts[shortcut];
      }
      option = (ref = config.options) != null ? ref[key] : void 0;
      if (!shortcut && config.strict && !option) {
        console.error(`Invalid option ${JSON.stringify(key)}`);
      }
      if (shortcut && !option) {
        if (config.root) {
          console.error(`不合法参数: "-${shortcut}"`);
        } else {
          console.error(`不合法参数: "-${shortcut}" in command "${config.name}"`);
        }
      }
      // Auto discovery
      if (!option) {
        type = argv[index] && argv[index][0] !== '-' ? 'string' : 'boolean';
        option = {
          name: key,
          type: type
        };
      }
      switch (option.type) {
        case 'boolean':
          params[key] = true;
          break;
        case 'string':
          value = argv[index++];
          if (value == null) {
            console.error(`Invalid Option: no value found for option ${JSON.stringify(key)}`);
          }
          if (value[0] === '-') {
            console.error(`Invalid Option: no value found for option ${JSON.stringify(key)}`);
          }
          params[key] = value;
          break;
        case 'integer':
          value = argv[index++];
          if (value == null) {
            console.error(`Invalid Option: no value found for option ${JSON.stringify(key)}`);
          }
          if (value[0] === '-') {
            console.error(`Invalid Option: no value found for option ${JSON.stringify(key)}`);
          }
          params[key] = parseInt(value, 10);
          break;
        case 'array':
          value = argv[index++];
          if (value == null) {
            console.error(`Invalid Option: no value found for option ${JSON.stringify(key)}`);
          }
          if (value[0] === '-') {
            console.error(`Invalid Option: no value found for option ${JSON.stringify(key)}`);
          }
          if (params[key] == null) {
            params[key] = [];
          }
          params[key].push(...value.split(','));
      }
    }
    // Check if help is requested
    helping = false;
    ref1 = config.options;
    for (_ in ref1) {
      option = ref1[_];
      if (option.help !== true) {
        continue;
      }
      if (params[option.name]) {
        helping = true;
      }
    }
    if (helping) {
      return params;
    }
    ref2 = config.options;
    // Check against required options
    for (_ in ref2) {
      option = ref2[_];
      if (option.required) {
        if (!(helping || (params[option.name] != null))) {
          console.error(`Required option argument "${option.name}"`);
        }
      }
      if (option.one_of) {
        values = params[option.name];
        if (!Array.isArray(values)) {
          values = [values];
        }
        for (j = 0, len = values.length; j < len; j++) {
          value = values[j];
          if (indexOf.call(option.one_of, value) < 0) {
            console.error(`Invalid value "${value}" for option "${option.name}"`);
          }
        }
      }
    }
    // We still have some argument to parse
    if (argv.length !== index) {
      // Store the full command in the return object
      leftover = argv.slice(index).join(' ');
      if (config.main) {
        params[config.main.name] = leftover;
      } else {
        command = argv[index];
        if (!config.commands[command]) {
          // Validate the command
          console.error(`Fail to parse end of command "${leftover}"`);
        }
        // Set the parameter relative to the command
        if (typeof params[config.command] === 'string') {
          params[config.command] = [params[config.command]];
        }
        if (Array.isArray(params[config.command])) {
          params[config.command].push(argv[index++]);
        } else {
          params[config.command] = argv[index++];
        }
        // Parse child configuration
        parse(config.commands[command], argv);
      }
    }
    // Command mode but no command are found, default to help
    // Happens with global options without a command
    if (Object.keys(this.config.commands).length && !params[this.config.command]) {
      params[this.config.command] = 'help';
    }
    // Check against required main
    main = config.main;
    if (main) {
      if (main.required) {
        if (params[main.name] == null) {
          console.error(`Required main argument "${main.name}"`);
        }
      }
    }
    return params;
  };
  // If they are commands (other than help) and no arguments are provided,
  // we default to the help action
  if (Object.keys(this.config.commands).length && argv.length === index) {
    argv.push('help');
  }
  // If there are commands... for the rest, i dont know, might be old leftover
  if (Object.keys(this.config.commands).length && argv[index].substr(0, 1) !== '-') {
    config = this.config.commands[argv[index]];
    if (!config) {
      console.error(`Invalid Command: "${argv[index]}"`);
    }
    params[this.config.command] = argv[index++];
  } else {
    config = this.config;
  }
  // Start the parser
  params = parse(config, argv);
  // Enrich params with default values
  set_default(this.config, params);
  return params;
};

// ## `stringify([script], params, [options])`

// * `script`   
//   A script which will prefixed the arguments, optional.
// * `params`   
//   Parameter object to stringify into arguments, required.
// * `options`   
//   Object containing any options, optional.

// Convert an object into process arguments.
Parameters.prototype.stringify = function(params, options = {}) {
  var argv, key, keys, stringify, value;
  argv = options.script ? [process.execPath, options.script] : [];
  keys = {};
  set_default(this.config, params);
  // Stringify
  stringify = function(config) {
    var _, command, j, key, len, option, ref, val, value;
    ref = config.options;
    for (_ in ref) {
      option = ref[_];
      key = option.name;
      keys[key] = true;
      value = params[key];
      if (option.required && (value == null)) {
        // Validate required value
        console.error(`Required option argument "${key}"`);
      }
      // Validate value against option "one_of"
      if ((value != null) && option.one_of) {
        if (!Array.isArray(value)) {
          value = [value];
        }
        for (j = 0, len = value.length; j < len; j++) {
          val = value[j];
          if (indexOf.call(option.one_of, val) < 0) {
            console.error(`Invalid value "${val}" for option "${option.name}"`);
          }
        }
      }
      // Serialize
      if (value) {
        switch (option.type) {
          case 'boolean':
            argv.push(`--${key}`);
            break;
          case 'string':
          case 'integer':
            argv.push(`--${key}`);
            argv.push(`${value}`);
            break;
          case 'array':
            argv.push(`--${key}`);
            argv.push(`${value.join(',')}`);
        }
      }
    }
    if (config.main) {
      value = params[config.main.name];
      if (config.main.required && (value == null)) {
        console.error(`Required main argument "${config.main.name}"`);
      }
      keys[config.main.name] = value;
      if (value != null) {
        argv.push(value);
      }
    }
    // Recursive
    if (Object.keys(config.commands).length) {
      command = params[config.command];
      if (Array.isArray(command)) {
        command = params[config.command].shift();
      }
      argv.push(command);
      keys[config.command] = command;
      if (!config.commands[command]) {
        // Stringify child configuration
        console.error(`Invalid Command: "${command}"`);
      }
      return stringify(config.commands[command]);
    }
  };
  stringify(this.config);
  // Handle params not defined in the configuration
  // Note, they are always pushed to the end and associated with the deepest child
  for (key in params) {
    value = params[key];
    if (keys[key]) {
      continue;
    }
    if (this.config.strict) {
      console.error(`Invalid option ${JSON.stringify(key)}`);
    }
    if (typeof value === 'boolean') {
      if (value) {
        argv.push(`--${key}`);
      }
    } else if (typeof value === 'undefined' || value === null) {

    } else {
      // nothing
      argv.push(`--${key}`);
      argv.push(`${value}`);
    }
  }
  return argv;
};

// ## `helping(params)` or `helping(arv)`

// * `params`   
//   Parameter object as returned by parsed.
// * `argv`   
//   An array of CLI arguments.

// Return zero to n commands if help not requested or null otherwise.
Parameters.prototype.helping = function() {
  var args, command, commands, conf, helping, i, j, len, params;
  args = Array.prototype.slice.call(arguments);
  if (Array.isArray(args[0])) {
    params = this.parse(args[0]);
  } else if (is_object(args[0])) {
    params = args[0];
  } else {
    console.error(`Invalid Arguments: expect a params object or an argv array as first argument, got ${JSON.stringify(args[0])}`);
  }
  params = merge({}, params);
  commands = [];
  // Build the commands array with help and without main
  conf = this.config;
  while (conf) {
    if (!Object.keys(conf.commands).length) {
      // Stop if there are no more sub commands
      break;
    }
    command = params[conf.command];
    if (typeof command === 'string') {
      commands.push(command);
      delete params[conf.command];
    } else if (Array.isArray(command)) {
      commands.push(command[0]);
      command.shift();
    }
    conf = conf.commands[command];
  }
  conf = this.config;
  helping = false;
  if (Object.values(conf.options).filter(function(option) {
    return option.help;
  }).some(function(options) {
    return params[options.name];
  })) {
    helping = true;
  }
  for (i = j = 0, len = commands.length; j < len; i = ++j) {
    command = commands[i];
    if (Object.values(conf.options).filter(function(option) {
      return option.help;
    }).some(function(options) {
      return params[options.name];
    })) {
      helping = true;
    }
    if (conf.commands[command].help) {
      helping = true;
      commands = commands.slice(0, i);
      if (params[conf.commands[command].main.name]) {
        commands.push(...params[conf.commands[command].main.name].split(' '));
      }
      break;
    }
    conf = conf.commands[command];
  }
  if (helping) {
    return commands;
  } else {
    return null;
  }
};

// ## `help(params, [options])` or `help(commands..., [options])`

// * `params(object)`   
//   Parameter object as returned by parsed, required if first argument is an object.
// * `commands(strings)`   
//   A list of commands passed as strings, required if first argument is a string.
// * `options(object)`   
//   Object containing any options, optional.

// Return a string describing the usage of the overall command or one of its
// command.
Parameters.prototype.help = function() {
  var _, arg, args, cmd, command, commands, config, configs, content, description, has_help_command, has_help_option, i, j, k, l, len, len1, len2, len3, len4, line, m, n, name, option, options, ref, ref1, ref2, ref3, ref4, ref5, shortcut, synopsis;
  args = Array.prototype.slice.call(arguments);
  // Get options
  if (args.length > 1) {
    if (is_object(args[args.length - 1])) {
      options = args.pop();
    }
  }
  // Get commands as an array of sub commands
  if (is_object(args[0])) {
    if (args.length > 1) {
      console.error('Invalid Arguments: only one argument is expected if first argument is an object');
    }
    if (!(commands = this.helping(args[0]))) {
      return;
    }
  } else if (Array.isArray(args[0])) {
    ref = args[0];
    for (j = 0, len = ref.length; j < len; j++) {
      arg = ref[j];
      if (typeof arg !== 'string') {
        console.error(`Invalid Arguments: argument is not a string, got ${JSON.stringify(arg)}`);
      }
    }
    commands = args[0];
  } else if (typeof args[0] === 'string') {
    for (k = 0, len1 = args.length; k < len1; k++) {
      arg = args[k];
      if (typeof arg !== 'string') {
        console.error(`Invalid Arguments: argument is not a string, got ${JSON.stringify(arg)}`);
      }
    }
    commands = args;
  } else if (args.length === 0) {
    commands = [];
  } else {
    console.error(`Invalid Arguments: first argument must be a string, an array or an object, got ${JSON.stringify(args[0])}`);
  }
  if (options == null) {
    options = {};
  }
  // commands = [] if commands.length is 1 and commands[0] is 'help'
  // Build a config array reflecting the hierarchical nature of commands
  config = this.config;
  configs = [config];
  for (i = l = 0, len2 = commands.length; l < len2; i = ++l) {
    command = commands[i];
    config = config.commands[command];
    if (!config) {
      console.error(`Invalid Command: "${commands.slice(0, i + 1).join(' ')}"`);
    }
    configs.push(config);
  }
  // Init
  content = [];
  content.push('');
  // Name
  content.push('NAME');
  name = configs.map(function(config) {
    return config.name;
  }).join(' ');
  description = configs[configs.length - 1].description;
  content.push(`    ${name} - ${description}`);
  // Synopsis
  content.push('');
  content.push('SYNOPSIS');
  synopsis = [];
  for (i = m = 0, len3 = configs.length; m < len3; i = ++m) {
    config = configs[i];
    synopsis.push(config.name);
    // Find if there are options other than help
    // has_options = Object.values(config.options).some((option) -> not option.help)
    // if Object.keys(config.options).length
    if (Object.values(config.options).some(function(option) {
      return !option.help;
    })) {
      synopsis.push(`[${config.name} options]`);
    }
    // Is current config
    if (i === configs.length - 1) {
      // There are more subcommand
      if (Object.keys(config.commands).length) {
        synopsis.push(`<${config.command}>`);
      } else if (config.main) {
        synopsis.push(`{${config.main.name}}`);
      }
    }
  }
  content.push('    ' + synopsis.join(' '));
  ref1 = configs.slice(0).reverse();
  // Options
  for (n = 0, len4 = ref1.length; n < len4; n++) {
    config = ref1[n];
    if (Object.keys(config.options).length || config.main) {
      content.push('');
      if (configs.length === 1) {
        content.push("OPTIONS");
      } else {
        content.push(`OPTIONS for ${config.name}`);
      }
    }
    if (Object.keys(config.options).length) {
      ref2 = config.options;
      for (_ in ref2) {
        option = ref2[_];
        shortcut = option.shortcut ? `-${option.shortcut} ` : '';
        line = '    ';
        line += `${shortcut}--${option.name}`;
        line = pad(line, 28);
        if (line.length > 28) {
          content.push(line);
          line = ' '.repeat(28);
        }
        line += option.description || `No description yet for the ${option.name} option.`;
        if (option.required) {
          line += ' Required.';
        }
        content.push(line);
      }
    }
    if (config.main) {
      line = '    ';
      line += `${config.main.name}`;
      line = pad(line, 28);
      if (line.length > 28) {
        content.push(line);
        line = ' '.repeat(28);
      }
      line += config.main.description || `No description yet for the ${config.main.name} option.`;
      content.push(line);
    }
  }
  // Command
  config = configs[configs.length - 1];
  if (Object.keys(config.commands).length) {
    content.push('');
    content.push('COMMANDS');
    ref3 = config.commands;
    for (_ in ref3) {
      command = ref3[_];
      line = [`${command.name}`];
      line = pad(`    ${line.join(' ')}`, 28);
      if (line.length > 28) {
        content.push(line);
        line = ' '.repeat(28);
      }
      line += command.description || `No description yet for the ${command.name} command.`;
      content.push(line);
    }
    ref4 = config.commands;
    // Detailed command information
    for (_ in ref4) {
      command = ref4[_];
      content.push('');
      content.push(`COMMAND "${command.name}"`);
      // Raw command, no main, no child commands
      if (!Object.keys(command.commands).length && !((ref5 = command.main) != null ? ref5.required : void 0)) {
        line = `${command.name}`;
        line = pad(`    ${line}`, 28);
        if (line.length > 28) {
          content.push(line);
          line = ' '.repeat(28);
        }
        line += command.description || `No description yet for the ${command.name} command.`;
        content.push(line);
      }
      // Command with main
      if (command.main) {
        line = `${command.name} {${command.main.name}}`;
        line = pad(`    ${line}`, 28);
        if (line.length > 28) {
          content.push(line);
          line = ' '.repeat(28);
        }
        line += command.main.description || `No description yet for the ${command.main.name} option.`;
        content.push(line);
      }
      // Command with child commands
      if (Object.keys(command.commands).length) {
        line = [`${command.name}`];
        if (Object.keys(command.options).length) {
          line.push(`[${command.name} options]`);
        }
        line.push(`<${command.command}>`);
        content.push('    ' + line.join(' '));
        commands = Object.keys(command.commands);
        if (commands.length === 1) {
          content.push(`    Where command is ${Object.keys(command.commands)}.`);
        } else if (commands.length > 1) {
          content.push(`    Where command is one of ${Object.keys(command.commands).join(', ')}.`);
        }
      }
    }
  }
  // Add examples
  config = configs[configs.length - 1];
  has_help_option = Object.values(config.options).some(function(option) {
    return option.name === 'help';
  });
  has_help_command = Object.values(config.commands).some(function(command) {
    return command.name === 'help';
  });
  has_help_option = true;
  content.push('');
  content.push('EXAMPLES');
  cmd = configs.map(function(config) {
    return config.name;
  }).join(' ');
  if (has_help_option) {
    line = pad(`    ${cmd} --help`, 28);
    if (line.length > 28) {
      content.push(line);
      line = ' '.repeat(28);
    }
    line += 'Show this message';
    content.push(line);
  }
  if (has_help_command) {
    line = pad(`    ${cmd} help`, 28);
    if (line.length > 28) {
      content.push(line);
      line = ' '.repeat(28);
    }
    line += 'Show this message';
    content.push(line);
  }
  content.push('');
  return content.join('\n');
};

// ## `load(module)`

// * `module`   
//   Name of the module to load, required.

// Load and return a module, use `require.main.require` by default but can be
// overwritten by the `load` options passed in the configuration.
Parameters.prototype.load = function(module) {
  if (!this.config.load) {
    return load(module);
  } else {
    if (typeof this.config.load === 'string') {
      return load(this.config.load)(module);
    } else {
      return this.config.load(module);
    }
  }
};

module.exports = function(config) {
  return new Parameters(config);
};

module.exports.Parameters = Parameters;

// ## Miscellaneous

// Dependencies
pad = require('pad');

load = require('./load');

merge = require('./merge');

// Internal types
types = ['string', 'boolean', 'integer', 'array'];

// Distinguish plain literal object from arrays
is_object = function(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
};

// Convert an array to an object
array_to_object = function(elements, key) {
  var element, j, len, opts;
  opts = {};
  for (j = 0, len = elements.length; j < len; j++) {
    element = elements[j];
    opts[element[key]] = element;
  }
  return opts;
};

// Given a configuration, apply default values to the parameters
set_default = function(config, params, tempparams = null) {
  var _, command, name1, option, ref;
  if (tempparams == null) {
    tempparams = merge({}, params);
  }
  if (Object.keys(config.commands).length) {
    command = tempparams[config.command];
    if (Array.isArray(command)) {
      command = tempparams[config.command].shift();
    }
    // We are not validating if the command is valid, it may not be set if help option is present
    // console.error "Invalid Command: \"#{command}\"" unless config.commands[command]
    if (config.commands[command]) {
      params = set_default(config.commands[command], params, tempparams);
    }
  }
  ref = config.options;
  for (_ in ref) {
    option = ref[_];
    if (option.default != null) {
      if (params[name1 = option.name] == null) {
        params[name1] = option.default;
      }
    }
  }
  return params;
};
