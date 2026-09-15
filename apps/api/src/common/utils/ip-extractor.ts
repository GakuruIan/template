import { Request } from 'express';

export class IpExtractor {
  /**
   * Extract the real client IP address from request
   * Handles proxies, load balancers, and CDNs
   */
  static getClientIp(request: Request): string {
    // List of headers to check (in priority order)
    const headers = [
      'cf-connecting-ip', // CloudFlare
      'x-forwarded-for', // Standard proxy header
      'x-real-ip', // Nginx proxy
      'x-client-ip', // Apache
      'x-cluster-client-ip', // Rackspace LB
      'forwarded-for', // RFC 7239
      'forwarded', // RFC 7239
      'fastly-client-ip', // Fastly CDN
      'true-client-ip', // Akamai, CloudFlare
      'x-forwarded', // General
    ];

    // Check each header
    for (const header of headers) {
      const value = request.headers[header];

      if (value) {
        // Handle multiple IPs (x-forwarded-for can have multiple)
        const ips = value
          .toString()
          .split(',')
          .map((ip) => ip.trim());

        // Return first valid IP
        for (const ip of ips) {
          if (this.isValidIp(ip) && !this.isPrivateIp(ip)) {
            return ip;
          }
        }
      }
    }

    // Fallback to connection IP
    const connectionIp =
      request.socket?.remoteAddress ||
      request.connection?.remoteAddress ||
      request.ip;

    return this.normalizeIp(connectionIp || 'unknown');
  }

  /**
   * Validate IP address format
   */
  private static isValidIp(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 validation (basic)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  }

  /**
   * Check if IP is private/internal
   */
  private static isPrivateIp(ip: string): boolean {
    // Private IPv4 ranges
    const privateRanges = [
      /^10\./, // 10.0.0.0 - 10.255.255.255
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0 - 172.31.255.255
      /^192\.168\./, // 192.168.0.0 - 192.168.255.255
      /^127\./, // Localhost
      /^169\.254\./, // Link-local
      /^::1$/, // IPv6 localhost
      /^fe80:/, // IPv6 link-local
      /^fc00:/, // IPv6 private
    ];

    return privateRanges.some((range) => range.test(ip));
  }

  /**
   * Normalize IP address (clean IPv6 mappings)
   */
  private static normalizeIp(ip: string): string {
    // Convert IPv6-mapped IPv4 to IPv4
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }

    // Normalize localhost
    if (ip === '::1') {
      return '127.0.0.1';
    }

    return ip;
  }

  /**
   * Get additional IP information
   */
  static getIpInfo(request: Request): {
    ip: string;
    proxyIps: string[];
    headers: Record<string, string>;
  } {
    const ip = this.getClientIp(request);

    // Extract all IPs from x-forwarded-for
    const forwardedFor = request.headers['x-forwarded-for']?.toString() || '';
    const proxyIps = forwardedFor
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip && this.isValidIp(ip));

    // Capture relevant headers
    const headers: Record<string, string> = {};
    const relevantHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip',
      'true-client-ip',
      'x-forwarded-proto',
      'x-forwarded-host',
    ];

    relevantHeaders.forEach((header) => {
      const value = request.headers[header];
      if (value) {
        headers[header] = value.toString();
      }
    });

    return {
      ip,
      proxyIps,
      headers,
    };
  }
}
