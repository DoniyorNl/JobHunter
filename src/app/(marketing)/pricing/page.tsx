import React from 'react';
import Link from 'next/link';
import { CheckIcon } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-4 text-lg text-gray-500">
          Choose the plan that&apos;s right for you.
        </p>
      </div>

      <div className="mt-10 max-w-md mx-auto grid grid-cols-1 gap-8 lg:grid-cols-2 lg:max-w-4xl">
        {/* Free Plan */}
        <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
            <h3 className="text-lg font-medium text-gray-900">Free</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-extrabold text-gray-900">$0</span>
              <span className="ml-1 text-2xl font-medium text-gray-500">/month</span>
            </div>
            <p className="mt-5 text-base text-gray-500">Perfect for individuals just starting their job search.</p>
          </div>
          <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
            <ul role="list" className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <p className="ml-3 text-base text-gray-700">Track up to 5 jobs</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <p className="ml-3 text-base text-gray-700">Basic AI resume tailoring</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <p className="ml-3 text-base text-gray-700">1 resume template</p>
              </li>
            </ul>
            <div className="rounded-md shadow">
              <Link href="/signup" className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Start for free
              </Link>
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
            <h3 className="text-lg font-medium text-gray-900">Pro</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-5xl font-extrabold text-gray-900">$9</span>
              <span className="ml-1 text-2xl font-medium text-gray-500">/month</span>
            </div>
            <p className="mt-5 text-base text-gray-500">For serious job seekers who want to maximize their chances.</p>
          </div>
          <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
            <ul role="list" className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <p className="ml-3 text-base text-gray-700">Unlimited job tracking</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <p className="ml-3 text-base text-gray-700">Advanced AI resume tailoring & suggestions</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <p className="ml-3 text-base text-gray-700">All resume templates</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <p className="ml-3 text-base text-gray-700">Priority support</p>
              </li>
            </ul>
            <div className="rounded-md shadow">
              <a href="#" className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                Get Pro
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
