import metadata from '../metadata.min'
import parser from '../source/parse'

function parse(...parameters)
{
	parameters.push(metadata)
	return parser.apply(this, parameters)
}

describe('parse', () =>
{
	it('should not parse invalid phone numbers', function()
	{
		// Too short.
		parse('+7 (800) 55-35-35').should.deep.equal({})
		// Too long.
		parse('+7 (800) 55-35-35-55').should.deep.equal({})

		parse('+7 (800) 55-35-35', 'US').should.deep.equal({})
		parse('(800) 55 35 35', { defaultCountry: 'RU' }).should.deep.equal({})
		parse('+1 187 215 5230', 'US').should.deep.equal({})
		parse('+1 1877 215 5230', 'US').should.deep.equal({})
	})

	it('should parse valid phone numbers', function()
	{
		// Instant loans
		// https://www.youtube.com/watch?v=6e1pMrYH5jI
		//
		// Restrict to RU
		parse('8 (800) 555 35 35', 'RU').should.deep.equal({ country: 'RU', phone: '8005553535', starts_at: 0, ends_at: 17 })
		// International format
		parse('+7 (800) 555-35-35').should.deep.equal({ country: 'RU', phone: '8005553535', starts_at: 0, ends_at: 18 })
		// // Restrict to US, but not a US country phone code supplied
		// parse('+7 (800) 555-35-35', 'US').should.deep.equal({})
		// Restrict to RU
		parse('(800) 555 35 35', 'RU').should.deep.equal({ country: 'RU', phone: '8005553535', starts_at: 0, ends_at: 15 })
		// Default to RU
		parse('8 (800) 555 35 35', { defaultCountry: 'RU' }).should.deep.equal({ country: 'RU', phone: '8005553535', starts_at: 0, ends_at: 17 })

		// Gangster partyline
		parse('+1-213-373-4253').should.deep.equal({ country: 'US', phone: '2133734253', starts_at: 0, ends_at: 15 })

		// Switzerland (just in case)
		parse('044 668 18 00', 'CH').should.deep.equal({ country: 'CH', phone: '446681800', starts_at: 0, ends_at: 13 })

		// China, Beijing
		parse('010-852644821', 'CN').should.deep.equal({ country: 'CN', phone: '10852644821', starts_at: 0, ends_at: 13 })

		// France
		parse('+33169454850').should.deep.equal({ country: 'FR', phone: '169454850', starts_at: 0, ends_at: 12 })

		// UK (Jersey)
		parse('+44 7700 300000').should.deep.equal({ country: 'JE', phone: '7700300000', starts_at: 0, ends_at: 15 })

		// KZ
		parse('+7 702 211 1111').should.deep.equal({ country: 'KZ', phone: '7022111111', starts_at: 0, ends_at: 15 })

		// Brazil
		parse('11987654321', 'BR').should.deep.equal({ country: 'BR', phone: '11987654321', starts_at: 0, ends_at: 11 })

		// Long country phone code.
		parse('+212659777777').should.deep.equal({ country: 'MA', phone: '659777777', starts_at: 0, ends_at: 13 })

		// No country could be derived.
		// parse('+212569887076').should.deep.equal({ countryPhoneCode: '212', phone: '569887076' })
	})

	it('should parse possible numbers', function()
	{
		// Invalid phone number for a given country.
		parse('1112223344', 'RU', { extended: true }).should.deep.equal
		({
			country            : 'RU',
			countryCallingCode : '7',
			phone              : '1112223344',
			ext                : undefined,
			valid              : false,
			possible           : true,
			starts_at 				 : 0,
			ends_at 					 : 10,
		})

		// International phone number.
		// Several countries with the same country phone code.
		parse('+71112223344').should.deep.equal({})
		parse('+71112223344', { extended: true }).should.deep.equal
		({
			country            : undefined,
			countryCallingCode : '7',
			phone              : '1112223344',
			ext                : undefined,
			valid              : false,
			possible           : true,
			starts_at 				 : 0,
			ends_at 					 : 12,
		})

		// International phone number.
		// Single country with the given country phone code.
		parse('+33011222333', { extended: true }).should.deep.equal
		({
			country            : 'FR',
			countryCallingCode : '33',
			phone              : '011222333',
			ext                : undefined,
			valid              : false,
			possible           : true,
			starts_at 				 : 0,
			ends_at 					 : 12,
		})

		// Too short.
		parse('+7 (800) 55-35-35 hey', { extended: true }).should.deep.equal
		({
			country            : undefined,
			countryCallingCode : '7',
			phone              : '800553535',
			ext                : undefined,
			valid              : false,
			possible           : false,
			starts_at 				 : 0,
			ends_at 					 : 17,
		})

		// Too long.
		parse('+7 (800) 55-35-35-55', { extended: true }).should.deep.equal
		({
			country            : undefined,
			countryCallingCode : '7',
			phone              : '80055353555',
			ext                : undefined,
			valid              : false,
			possible           : false,
			starts_at 				 : 0,
			ends_at 					 : 20,
		})

		// Too long (extra text)
		parse('hi my number is +7 (800) 55-35-35-55 please get back to me', { extended: true }).should.deep.equal
		({
			country            : undefined,
			countryCallingCode : '7',
			phone              : '80055353555',
			ext                : undefined,
			valid              : false,
			possible           : false,
			starts_at 				 : 16,
			ends_at 					 : 36,
		})

		// No national number to be parsed.
		parse('+996', { extended: true }).should.deep.equal
		({
			countryCallingCode : '996'
		})

		// Valid number.
		parse('+78005553535', { extended: true }).should.deep.equal
		({
			country            : 'RU',
			countryCallingCode : '7',
			phone              : '8005553535',
			ext                : undefined,
			valid              : true,
			possible           : true,
			starts_at 				 : 0,
			ends_at 					 : 12,
		})

		// Valid number extra text.
		parse('my number is +78005553535 thank you', { extended: true }).should.deep.equal
		({
			country            : 'RU',
			countryCallingCode : '7',
			phone              : '8005553535',
			ext                : undefined,
			valid              : true,
			possible           : true,
			starts_at 				 : 13,
			ends_at 					 : 25,
		})
	})

	it('should parse non-European digits', function()
	{
		parse('+١٢١٢٢٣٢٣٢٣٢').should.deep.equal({ country: 'US', phone: '2122323232', starts_at: 0, ends_at: 12 })
	})

	it('should work in edge cases', function()
	{
		let thrower

		// No input
		parse('').should.deep.equal({})

		// No country phone code
		parse('+').should.deep.equal({})

		// No country at all (non international number and no explicit country code)
		parse('123').should.deep.equal({})

		// No country metadata for this `require` country code
		thrower = () => parse('123', 'ZZ')
		thrower.should.throw('Unknown country')

		// No country metadata for this `default` country code
		thrower = () => parse('123', { defaultCountry: 'ZZ' })
		thrower.should.throw('Unknown country')

		// Invalid country phone code
		parse('+210').should.deep.equal({})

		// Country phone code beginning with a '0'
		parse('+0123').should.deep.equal({})

		// Barbados NANPA phone number
		parse('+12460000000').should.deep.equal({ country: 'BB', phone: '2460000000', starts_at: 0, ends_at: 12 })

		// // A case when country (restricted to) is not equal
		// // to the one parsed out of an international number.
		// parse('+1-213-373-4253', 'RU').should.deep.equal({})

		// National (significant) number too short
		parse('2', 'US').should.deep.equal({})

		// National (significant) number too long
		parse('222222222222222222', 'US').should.deep.equal({})

		// No `national_prefix_for_parsing`
		parse('41111', 'AC').should.deep.equal({ country: 'AC', phone: '41111', starts_at: 0, ends_at: 5})

		// National prefix transform rule (Mexico).
		// Local cell phone from a land line: 044 -> 1.
		parse('0445511111111', 'MX').should.deep.equal({ country: 'MX', phone: '15511111111', starts_at: 0, ends_at: 13 })

		// No metadata
		thrower = () => parser('')
		thrower.should.throw('Metadata is required')

		// No metadata
		thrower = () => parser('', {})
		thrower.should.throw('Metadata is required')

		// Numerical `value`
		thrower = () => parse(2141111111, 'US')
		thrower.should.throw('A phone number for parsing must be a string.')
	})

	it('should parse phone number extensions', function()
	{
		// "ext"
		parse('2134567890 ext 123', 'US').should.deep.equal
		({
			country 	: 'US',
			phone   	: '2134567890',
			ext     	: '123',
			starts_at	: 0,
			ends_at		: 18,
		})

		// "ext."
		parse('+12134567890 ext. 12345', 'US').should.deep.equal
		({
			country 	: 'US',
			phone   	: '2134567890',
			ext     	: '12345',
			starts_at	: 0,
			ends_at		: 23,
		})

		// "#"
		parse('+12134567890#1234').should.deep.equal
		({
			country 	: 'US',
			phone   	: '2134567890',
			ext     	: '1234',
			starts_at	: 0,
			ends_at		: 17,
		})

		// "x"
		parse('+78005553535 x1234').should.deep.equal
		({
			country : 'RU',
			phone   : '8005553535',
			ext     : '1234',
			starts_at: 0,
			ends_at: 18,
		})

		// Not a valid extension
		parse('2134567890 ext. 1234567890', 'US').should.deep.equal({})
	})

	it('should parse RFC 3966 phone numbers', function()
	{
		parse('tel:+78005553535;ext:123').should.deep.equal
		({
			country 	: 'RU',
			phone   	: '8005553535',
			ext     	: '123',
			starts_at	: 0,
			ends_at		: 24,
		})

		// Invalid number.
		parse('tel:+7x8005553535;ext:123').should.deep.equal({})
	})
})
