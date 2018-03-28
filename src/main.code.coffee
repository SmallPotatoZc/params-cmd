default_config =
	name: "server"
	description: ""
	commands:[
		{
			name: "test",
			description: "test",
			options:[
				{
					name:"host"
					shortcut: "h"
					description:"host"
				}
			]
		},
		{
			name: "test2",
			description: "test2",
			options:[
				{
					name:"host"
					shortcut: "h"
					description:"host"
				}
			]
		}
	]

Parameters = () -> console.log 'dddd' 

Parameters.prototype.parse = (argv = process) ->
  argv = argv.split ' ' if typeof argv is 'string'
  index = 0
  # Remove node and script argv elements
  if argv is process
    index = 2
    argv = argv.argv
  # Extracted parameters
  params = {}
  parse = (config) =>
    # Read options
    while true
      break if argv.length is index or argv[index][0] isnt '-'
      key = argv[index++]
      shortcut = key[1] isnt '-'
      key = key.substring (if shortcut then 1 else 2), key.length
      shortcut = key if shortcut
      key = config.shortcuts[shortcut] if shortcut
      option = config.options?[key]
      throw Error "Invalid option #{JSON.stringify key}" if not shortcut and config.strict and not option
      if shortcut and not option
        if config.root
          throw Error "Invalid Shortcut: \"-#{shortcut}\""
        else
          throw Error "Invalid Shortcut: \"-#{shortcut}\" in command \"#{config.name}\""
      # Auto discovery
      unless option
        type = if argv[index] and argv[index][0] isnt '-' then 'string' else 'boolean'
        option = name: key, type: type
      switch option.type
        when 'boolean'
          params[key] = true
        when 'string'
          value = argv[index++]
          throw Error "Invalid Option: no value found for option #{JSON.stringify key}" unless value?
          throw Error "Invalid Option: no value found for option #{JSON.stringify key}" if value[0] is '-'
          params[key] = value
        when 'integer'
          value = argv[index++]
          throw Error "Invalid Option: no value found for option #{JSON.stringify key}" unless value?
          throw Error "Invalid Option: no value found for option #{JSON.stringify key}" if value[0] is '-'
          params[key] = parseInt value, 10
        when 'array'
          value = argv[index++]
          throw Error "Invalid Option: no value found for option #{JSON.stringify key}" unless value?
          throw Error "Invalid Option: no value found for option #{JSON.stringify key}" if value[0] is '-'
          params[key] ?= []
          params[key].push value.split(',')...
    # Check if help is requested
    helping = false
    for _, option of config.options
      continue unless option.help is true
      helping = true if params[option.name]
    return params if helping
    # Check against required options
    for _, option of config.options
      if option.required
        throw Error "Required option argument \"#{option.name}\"" unless helping or params[option.name]?
      if option.one_of
        values = params[option.name]
        values = [values] unless Array.isArray values
        for value in values
          throw Error "Invalid value \"#{value}\" for option \"#{option.name}\"" unless value in option.one_of
    # We still have some argument to parse
    if argv.length isnt index
      # Store the full command in the return object
      leftover = argv.slice(index).join(' ')
      if config.main
        params[config.main.name] = leftover
      else
        command = argv[index]
        # Validate the command
        throw Error "Fail to parse end of command \"#{leftover}\"" unless config.commands[command]
        # Set the parameter relative to the command
        if typeof params[config.command] is 'string'
          params[config.command] = [params[config.command]]
        if Array.isArray params[config.command]
          params[config.command].push argv[index++]
        else
          params[config.command] = argv[index++]
        # Parse child configuration
        parse config.commands[command], argv
    # Command mode but no command are found, default to help
    # Happens with global options without a command
    if Object.keys(@config.commands).length and not params[@config.command]
      params[@config.command] = 'help'
    # Check against required main
    main = config.main
    if main
      if main.required
        throw Error "Required main argument \"#{main.name}\"" unless params[main.name]?
    params
  # If they are commands (other than help) and no arguments are provided,
  # we default to the help action
  if Object.keys(@config.commands).length and argv.length is index
    argv.push 'help'
  # If there are commands... for the rest, i dont know, might be old leftover
  if Object.keys(@config.commands).length and argv[index].substr(0,1) isnt '-'
    config = @config.commands[argv[index]]
    throw Error "Invalid Command: \"#{argv[index]}\"" unless config
    params[@config.command] = argv[index++]
  else
    config = @config
  # Start the parser
  params = parse config, argv
  # Enrich params with default values
  set_default @config, params
  params
